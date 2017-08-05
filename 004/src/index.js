import * as THREE from 'three'

//node.js
import loop from 'raf-loop'
import WAGNER from '@superguigui/wagner'
import BloomPass from '@superguigui/wagner/src/passes/bloom/MultiPassBloomPass'
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass'
import Noise from '@superguigui/wagner/src/passes/noise/noise'
import VignettePass from '@superguigui/wagner/src/passes/vignette/VignettePass'
import DOFPass from '@superguigui/wagner/src/passes/dof/DOFPass'
import resize from 'brindille-resize'

// audio analyser and averager
import audioPlayer from 'web-audio-player'
import createAnalyser from 'web-audio-analyser'
import average from 'analyser-frequency-average'
import createAudioContext from 'ios-safe-audio-context'

//three.js
import WireframeG from './objects/WireframeG'
import OrbitControls from './controls/OrbitControls'

//utilities
import Map from './utils/math.map'
import player from './utils/audioplayer'
import { audioUtil, analyser, bands } from './utils/analyser'

import h from './utils/helpers'
import DAT from './vendor/dat.gui.min'

/* Custom variables */
var subAvg = 0
var lowAvg = 0
var midAvg = 0
var highAvg = 0

var time = 0
var t = 0
var tprev = t

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	multiplier: 8
}

gui.add(SETTINGS, 'multiplier').min(1).max(50).step(1)

/* Init renderer and canvas */
const container = document.body
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
// renderer.setClearColor(0x48e2dd) // use styles on
container.style.overflow = 'hidden'
container.style.margin = 0
container.appendChild(renderer.domElement)

/* Composer for special effects */
const composer = new WAGNER.Composer(renderer)
const bloomPass = new BloomPass()
const fxaaPass = new FXAAPass()
const noise = new Noise({
	amount : .1,
	speed : .1
})
const vignette = new VignettePass({
	boost : 1,
	reduction : 1
})
const dof = new DOFPass({
	focalDistance : .0001,
	aperture : .1,
	tBias : .1,
	blurAmount : .1
})

/* Main scene and camera */
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, resize.width / resize.height, 0.1, 1000)
const controls = new OrbitControls(camera, {
	element: renderer.domElement, 
	distance: 200,
	phi: Math.PI * 0.5,
	distanceBounds: [0, 300]
})

/* Actual content of the scene */
const wireframeG = new WireframeG(200, 40)
// scene.add(wireframeG)

// Various event listeners 
resize.addListener(onResize)

/* create main loop */
const engine = loop(render)

/**
  Resize canvas
*/
function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}

/////// magic stuff

const loader = new THREE.JSONLoader()
// contains the loaded geometry
var geoV

// load it async
function loadJsonAsync (url, onLoad, onProgress, onError) {
  return new Promise ((resolve, reject) => {
    const onProgress = (event) => console.log(`${event.loaded} of ${event.total}`)
    const onLoad = (geometry) => resolve (geometry)
    const onError = (event) => reject (event)

    loader.load(
    	url, onLoad, onProgress, onError)
  })
}

// when finished loading we start the scene
var cloud, nMax, mesh

loadJsonAsync('assets/Harpago_Chiragra.decimate0.125.json')
	.then((geometry) => {
		geoV = geometry
		nMax = geoV.vertices.length

		cloud = createParticles()
		scene.add(cloud)

		// loaded! 
		// TODO: show and remove some loader

		// and start the music
		player.play()

		// model loaded, lets start main loop
		engine.start()
	})

/* -------------------------------------------------------------------------------- */




/// POINTCLOUD THINGY

function createParticles(transparent, opacity, color) {
    var material = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors
    })
	
    geoV = new THREE.BufferGeometry().fromGeometry( geoV )

    return new THREE.Points( geoV, material )
}

/**
  Render loop
*/
function render(dt) {
	time += 0.0025
	controls.update()

	//update frequencies
	var freqs = audioUtil.frequencies()

	// update average of bands
	subAvg = average(analyser, freqs, bands.sub.from, bands.sub.to)
	lowAvg = average(analyser, freqs, bands.low.from, bands.low.to)
	midAvg = average(analyser, freqs, bands.mid.from, bands.mid.to)
	highAvg = average(analyser, freqs, bands.high.from, bands.high.to)
	// console.log(subAvg, lowAvg, midAvg, highAvg)
	
	/* smooth the object movement */
	tprev = t * .75
	t += .0025 + lowAvg

	// controls.distance = Map(Math.sin(Math.PI * time)+1, 1, 2, 200, 225)

	// var newcolor = new THREE.Color()
	// newcolor.setHSL(midAvg, midAvg, subAvg)
	var maxDrawRange = Math.round(nMax - (lowAvg+highAvg)*(nMax) ) * SETTINGS.multiplier
	cloud.geometry.setDrawRange( 0, maxDrawRange)

	/* camera */
	camera.setFocalLength ( 20 )

	composer.reset()
	composer.render(scene, camera)
	composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}