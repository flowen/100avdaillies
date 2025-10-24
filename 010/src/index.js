import * as THREE from 'three'

// post-processing
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

// three.js
import OrbitControls from './controls/OrbitControls'

// particles
import FlowField from './particles/flow-field'
import Particles from './particles/particles'

//utilities
import Map from './utils/math.map'
import player from './utils/audioplayer'
import { audioUtil, analyser, bands } from './utils/analyser'

import h from './utils/helpers'
import DAT from './vendor/dat.gui.min'
import preloader from './utils/preloader';



/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	vertexMultiplier: 2,
	velocityMultipler: 5,
	camDistance: 1,
	autoZoom: false
}

gui.add(SETTINGS, 'vertexMultiplier').min(1.0).max(5.0).step(.1)
gui.add(SETTINGS, 'velocityMultipler').min(1.0).max(5.0).step(.1)
gui.add(SETTINGS, 'camDistance').min(1).max(100).step(1)
gui.add(SETTINGS, 'autoZoom')

/* Init renderer and canvas */
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
// renderer.setClearColor(0x48e2dd) // use styles on

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
	distance: 10,
	phi: Math.PI * 0.5,
	distanceBounds: [0, 300],
	autoRotate: true
})

camera.position.x = -35
camera.position.y = 18
camera.position.z = 10
// controls.enabled = false
// controls.enableZoom = false
controls.autoRotate = true


function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}
onResize()
resize.addListener(onResize)


var particleCount = 40000

// init particles 
var flowField1 = new FlowField(250, 250, 10)
var particles1 = new Particles(particleCount, flowField1)
scene.add(particles1.points)

var flowField2 = new FlowField(250, 250, 10)
var particles2 = new Particles(particleCount, flowField2)
scene.add(particles2.points)

var flowField3 = new FlowField(50, 50, 250)
var particles3 = new Particles(particleCount, flowField3)
scene.add(particles3.points)

var flowField4 = new FlowField(50, 250, 50)
var particles4 = new Particles(particleCount, flowField4)
scene.add(particles4.points)

// and start the music
player.play()

/* create main loop */
// Initialize preloader and start the scene when ready
function initScene() {
  /* create and launch main loop */
  const engine = loop(render)
  engine.start()
}

// Set up preloader
function setupPreloader() {
  const preloaderEl = document.getElementById('preloader');
  const loadingText = document.getElementById('loading-text');
  const progressText = document.getElementById('progress-text');
  const startButton = document.getElementById('start-button');
  
  // Start loading assets
  preloader.loadAssets(
    (progress) => {
      progressText.textContent = `${progress}%`;
    },
    () => {
      // Loading complete
      loadingText.textContent = 'Ready!';
      progressText.style.display = 'none';
      startButton.style.display = 'block';
      
      startButton.addEventListener('click', () => {
        preloaderEl.style.display = 'none';
        initScene();
      });
    }
  );
}

// Start the preloader
setupPreloader();
/* make debugging easier */
// var axes = new THREE.AxisHelper(20)
// scene.add(axes)


// basically the next few variables are all feeders for procedural functions such as noise, movement, etc
var subAvg = 0
var lowAvg = 0
var midAvg = 0
var highAvg = 0

var uTime = 0
var t = 0
var tprev = t


/**
  Render loop
*/
function render(dt) {
	controls.update()
	if (SETTINGS.autoZoom) controls.distance = Map(Math.sin(Math.PI * uTime), -1, 1, 1, 50) + SETTINGS.camDistance

	
	//update frequencies
	var freqs = audioUtil.frequencies()

	// update average of bands
	subAvg = average(analyser, freqs, bands.sub.from, bands.sub.to)
	lowAvg = average(analyser, freqs, bands.low.from, bands.low.to)
	midAvg = average(analyser, freqs, bands.mid.from, bands.mid.to)
	highAvg = average(analyser, freqs, bands.high.from, bands.high.to)
	// console.log(subAvg, lowAvg, midAvg, highAvg)
	
	uTime += 0.0025
	tprev = t * .75 // smooth the object movement
	t += .0025 * tprev

	// move particles around
	var vtxM = Math.sin(uTime * SETTINGS.vertexMultiplier) + 5
	var velM = Math.cos(uTime * SETTINGS.velocityMultipler) + 5

	particles1.update(subAvg, lowAvg, midAvg, highAvg, vtxM, velM)
	particles2.update(subAvg, lowAvg, midAvg, highAvg, SETTINGS.vertexMultiplier, SETTINGS.velocityMultipler)
	particles3.update(subAvg, lowAvg, midAvg, highAvg, SETTINGS.vertexMultiplier, SETTINGS.velocityMultipler)
	particles4.update(subAvg, lowAvg, midAvg, highAvg, vtxM, velM)

	composer.reset()
	composer.render(scene, camera)
	composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}