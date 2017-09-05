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
import OrbitControls from './controls/OrbitControls'

//utilities
import Map from './utils/math.map'
import player from './utils/audioplayer'
import { audioUtil, analyser, bands, analyserBands, analysePlayer, analyseMic } from './utils/analyser'

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
	minimum: 0,
	dynamicRange: true,
	speedDynamicRange: .5,
	multiplyRangeWithLows: true,
	useMic: false
}

gui.add(SETTINGS, 'minimum').min(0).max(1).step(.01).listen()
const dR = gui.add(SETTINGS, 'dynamicRange')
dR.onChange((val) => !val ? SETTINGS.minimum = .1 : SETTINGS.minimum = 0 );
gui.add(SETTINGS, 'speedDynamicRange').min(0.1).max(.75).step(.01)
gui.add(SETTINGS, 'multiplyRangeWithLows')
const useMic = gui.add(SETTINGS, 'useMic')
useMic.onChange((val) => {
	// analysing of audio is automatically started in audioplayer events
	if (val) {
	  	player.stop();
	  	analyseMic();
  	} else {
  		player.play();
  		analysePlayer()
  	}
});

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

    loader.load(url, onLoad, onProgress, onError)
  })
}

// when finished loading we start the scene
// maxDrawBuffer = max of drawbuffer
let cloud, maxDrawBuffer, mesh

// 5 percent of drawbuffer total
let percent5

loadJsonAsync('assets/Harpago_Chiragra.decimate0.125.json')
	.then((geometry) => {
		geoV = geometry
		maxDrawBuffer = geoV.vertices.length * 3
		// we use this later to limit drawing of buffer
		percent5 = (maxDrawBuffer/100) * 5;

		cloud = createParticles()
		scene.add(cloud)

		// loaded! 
		// TODO: show and remove some loader

		// and start the music
		player.play()

		// analyse the music
		analysePlayer();

		// model loaded, lets start main loop
		engine.start()
	})

/* -------------------------------------------------------------------------------- */

/// POINTCLOUD THINGY

function createParticles(transparent, opacity, color) {
    var material = new THREE.PointsMaterial({ 
    	vertexColors: THREE.VertexColors,
    	size: .75
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
	controls.distance = Map(Math.sin(Math.PI * time)+1, 1, 2, 200, 225)

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

	var maxDrawRange = Math.round(maxDrawBuffer - (lowAvg - SETTINGS.minimum) * (maxDrawBuffer) )
	// limit maxDrawRange between 5% and 95%
	var limitMDR = Math.min(Math.max(maxDrawRange, percent5), maxDrawBuffer - percent5)
	var minDrawRange = Math.round((maxDrawBuffer*.33)*(highAvg + SETTINGS.minimum))

	if (SETTINGS.dynamicRange) {
		minDrawRange *= h.pulse(time)
		maxDrawRange *= h.pulse(time)
		
		SETTINGS.minimum = h.pulse(time*SETTINGS.speedDynamicRange)
		if (SETTINGS.multiplyRangeWithLows) SETTINGS.minimum *= lowAvg
	}

	cloud.geometry.setDrawRange( minDrawRange, limitMDR)

	cloud.rotation.x += lowAvg/100
	cloud.rotation.y += Math.sin(midAvg/100)
	cloud.material.size += Math.sin(lowAvg/100)/100

	/* camera */
	camera.setFocalLength ( 20 )

	// post processing
	composer.reset()
	composer.render(scene, camera)
	composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}