import * as THREE from 'three'

// post-processing
import WAGNER from '@superguigui/wagner'
import BloomPass from '@superguigui/wagner/src/passes/bloom/MultiPassBloomPass'
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass'
import Noise from '@superguigui/wagner/src/passes/noise/noise'
import VignettePass from '@superguigui/wagner/src/passes/vignette/VignettePass'
import DOFPass from '@superguigui/wagner/src/passes/dof/DOFPass'

// some tools
// import loop from 'raf-loop'
import resize from 'brindille-resize'
import statsMonitor from 'stats-monitor'

// audio analyser and averager
import audioPlayer from "audioplayer";
import createAnalyser from 'web-audio-analyser'
import average from 'analyser-frequency-average'
import createAudioContext from 'ios-safe-audio-context'

// three.js
import OrbitControls from './controls/OrbitControls'

// particles
import Attractors from './particles/attractors'
import Particles from './particles/particles'

//utilities
import Map from './utils/math.map'
import player from './utils/audioplayer'
import { audioUtil, analyser, bands } from './utils/analyser'

import h from './utils/helpers'
import {SETTINGS} from './utils/gui-controls'

/* Init renderer and canvas */
var renderer = new THREE.WebGLRenderer( { 
	preserveDrawingBuffer: true 
})
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.sortObjects = false
renderer.autoClearColor = false
renderer.autoClear = false

const container = document.body
container.style.overflow = 'hidden'
container.style.margin = 0
container.appendChild(renderer.domElement)

/* Composer for special effects */
const composer = new WAGNER.Composer(renderer)
const bloomPass = new BloomPass()
const fxaaPass = new FXAAPass()
const noise = new Noise({
	amount : .2,
	speed : .15
})
const vignette = new VignettePass({
	boost : 1,
	reduction : 1
})
const dof = new DOFPass({
	focalDistance : .001,
	aperture : .15,
	tBias : .24,
	blurAmount : .3
})

/* Main scene and camera */
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, resize.width / resize.height, 0.1, 1000)

const controls = new OrbitControls(camera, {
	element: renderer.domElement, 
	distance: SETTINGS.camDistance,
	phi: Math.PI * 0.5,
	distanceBounds: [0, 300]
})

function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}
onResize()
resize.addListener(onResize)

const stats = new statsMonitor()
stats.setMode(0); // 0: fps, 1: ms 

stats.domElement.style.position = 'absolute'
stats.domElement.style.left = '0px'
stats.domElement.style.top = '0px'
document.body.appendChild( stats.domElement )


// fun variables to play with
var attractor = new THREE.Vector3()
var particleCount = 200000 // watch performance!
var iAttractions = 2 // watch performance!

// init particles 
var particles = new Particles(particleCount)
scene.add(particles.points)

function calculateForce(aVector, pVector) {
  var f = new THREE.Vector3()
  var force = f.subVectors(aVector, pVector)
  var distance = force.length()

  force.divideScalar(distance)
  return force
}

// and start the music
player.play()

/* make debugging easier */
var axes = new THREE.AxisHelper(20)
scene.add(axes)

function animate() {
	requestAnimationFrame( animate )
	stats.begin()
	// monitored code goes here 
	render()
	stats.end()
	
}
animate()


// basically the next few variables are all feeders for procedural functions such as noise, movement, etc
var subAvg = 0
var lowAvg = 0
var midAvg = 0
var highAvg = 0

var time = 0
var tprev = time

/**
  Render loop
*/

function render(dt) {
	controls.update()
	// if (SETTINGS.autoRotateCam) controls.distance = Map(Math.sin(Math.PI * t), -1, 1, 1, 50) + SETTINGS.camDistance
	SETTINGS.axes === false ? axes.visible = false : axes.visible = true 
	if (SETTINGS.autoZoomCam) {
		controls.distance = Map(Math.sin(Math.PI * time), -1, 1, 1, 50)
	}
	if (SETTINGS.autoRotateCam) {
		camera.position.set( Math.sin(time) * .6, Math.cos(time) * .4, Math.cos(time) * 1.2)
	} else {
		controls.enabled = true
		controls.enableZoom = true
		controls.autoRotate = false
	}

	// update frequencies first
	var freqs = audioUtil.frequencies()
	// then update average of bands
	subAvg = average(analyser, freqs, bands.sub.from, bands.sub.to)
	lowAvg = average(analyser, freqs, bands.low.from, bands.low.to)
	midAvg = average(analyser, freqs, bands.mid.from, bands.mid.to)
	highAvg = average(analyser, freqs, bands.high.from, bands.high.to)
	// console.log(subAvg, lowAvg, midAvg, highAvg)
	
	time += .0025
	tprev = time * SETTINGS.tsmooth  // smooth the object movement

	particles.update()

	// let's draw all particles first and
	var pVertices = particles.points.geometry.vertices
	for (var i = 0; i < pVertices.length; i++) {
		var pVector = pVertices[i]
		// than we apply forces of all attractors to particle and calculate direction
		for (var j = 0; j < iAttractions; j++) {
			var attraction = calculateForce(attractor, pVector)
			particles.applyForce(attraction, i)
		}
	}

	// console.log(SETTINGS)
	if (SETTINGS.automateClamps) {
		SETTINGS.clampVEL = Map(Math.sin(Math.PI * time), -1, 1, .01, .1)
	}

	// renderer.render(scene, camera)
	composer.reset()
	composer.render(scene, camera)
	// composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}