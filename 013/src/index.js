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
import audioPlayer from "audioplayer";
import createAnalyser from 'web-audio-analyser'
import average from 'analyser-frequency-average'
import createAudioContext from 'ios-safe-audio-context'

// three.js
import OrbitControls from './controls/OrbitControls'

// particles
import FlowField from './particles/flow-field'
import Particles from './particles/particles'
import Attractors from './particles/attractors'

//utilities
import h from './utils/helpers'
import Map from './utils/math.map'
import player from './utils/audioplayer'
import { audioUtil, analyser, bands } from './utils/analyser'
import {SETTINGS} from './utils/gui-controls'

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
camera.position.set(-35, 18, 10)

const controls = new OrbitControls(camera, {
	element: renderer.domElement, 
	distance: SETTINGS.camDistance,
	phi: Math.PI * 0.5,
	distanceBounds: [0, 300],
	autoRotate: true
})

function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}
onResize()
resize.addListener(onResize)


// create a plane for picking up the Raycast
var planeGeom = new THREE.PlaneGeometry(800,200)
var planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff33,
  wireframe: true,
  transparent: true, 
  opacity: 0
})
var plane = new THREE.Mesh(planeGeom, planeMaterial)
scene.add(plane)


// init particles 
var particleCount = 50000
var particles = new Particles(particleCount)
scene.add(particles.points)

var attractors = new Attractors(3)
var attractorsGroup = attractors.group()
scene.add(attractorsGroup)

var attractorPos = attractorsGroup.children.map((vertex) => {
	return vertex.position
})


// Raycaster 
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector3()
var attractor = new THREE.Vector3()

document.addEventListener('mousemove', mouseMove, false)
function mouseMove(e) {
	e.preventDefault()
	// don't think about these values too much. They are necessary to setup mouse coords for the raycaster. See 
	mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
	mouse.unproject(camera) // very important!!

	raycaster.ray.set(camera.position, mouse.sub( camera.position ).normalize() )
	var intersects = raycaster.intersectObject(plane)
	
	// set last-known attractor point
	if (intersects.length > 0) attractor = intersects[0].point		
}

// init particles 
var particleCount = 100000
var particles = new Particles(particleCount)
scene.add(particles.points)

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
var axes = new THREE.AxisHelper(20)
scene.add(axes)

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
	
	if (SETTINGS.autoZoom) controls.distance = Map(Math.sin(Math.PI * t), -1, 1, 1, 50) + SETTINGS.camDistance
	SETTINGS.axes === false ? axes.visible = false : axes.visible = true

	//update frequencies & update average of bands
	var freqs = audioUtil.frequencies()
	subAvg = average(analyser, freqs, bands.sub.from, bands.sub.to)
	lowAvg = average(analyser, freqs, bands.low.from, bands.low.to)
	midAvg = average(analyser, freqs, bands.mid.from, bands.mid.to)
	highAvg = average(analyser, freqs, bands.high.from, bands.high.to)
	// console.log(subAvg, lowAvg, midAvg, highAvg)
	
	uTime += 0.025
	tprev = t * .75 // smooth the object movement
	t += .0025 * tprev

	if (SETTINGS.autoZoom) {
		controls.distance = Map(Math.sin(Math.PI * uTime), -1, 1, 80, 200) + SETTINGS.camDistance
		controls.enabled = false
		controls.enableZoom = false
		controls.autoRotate = true
		camera.position.set( Math.sin(uTime) * 6, Math.cos(uTime) * 4, Math.cos(uTime) * 12)
	} else {
		controls.enabled = true
		controls.enableZoom = true
		controls.autoRotate = false
	}
	
	plane.position.set(0,0,SETTINGS.zMax)

	// move particles around
	// var vtxM = Math.sin(uTime * SETTINGS.vertexMultiplier) + 5
	// var velM = Math.cos(uTime * SETTINGS.velocityMultipler) + 5

	particles.update()
	// particles.points.rotation.x += tprev/4

	// let's draw all particles first and
	var pVertices = particles.points.geometry.vertices
	for (var i = 0; i < pVertices.length; i++) {
		var pVector = pVertices[i]
		if (lowAvg > .8) {
			pVector.add(new THREE.Vector3(h.getRandomFloat(.5,SETTINGS.maxDisplace), h.getRandomFloat(.5,SETTINGS.maxDisplace), h.getRandomFloat(.5,SETTINGS.maxDisplace)))
		}
		// than we apply forces of all attractors to particle and calculate direction
		for (var j = 0; j < attractorPos.length; j++) {
			var attraction = attractors.calculateForce(attractor, pVector)
			particles.applyForce(attraction, i)
		}	
	}

	composer.reset()
	composer.render(scene, camera)
	composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}