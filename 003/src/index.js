import * as THREE from 'three';

//node.js
import loop from 'raf-loop';
import WAGNER from '@superguigui/wagner';
import BloomPass from '@superguigui/wagner/src/passes/bloom/MultiPassBloomPass';
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass';
import Noise from '@superguigui/wagner/src/passes/noise/noise';
import VignettePass from '@superguigui/wagner/src/passes/vignette/VignettePass';
import DOFPass from '@superguigui/wagner/src/passes/dof/DOFPass';
import resize from 'brindille-resize';
// import earcut from 'earcut';

// audio analyser and averager
import audioPlayer from "audioplayer";
import createAnalyser from 'web-audio-analyser';
import average from 'analyser-frequency-average';
import createAudioContext from 'ios-safe-audio-context';

//three.js
import WireframeG from './objects/WireframeG';
import OrbitControls from './controls/OrbitControls';

//utilities
import Map from './utils/math.map';
import player from './utils/audioplayer';
import { audioUtil, analyser, bands } from './utils/analyser';

import h from './utils/helpers';
import DAT from './vendor/dat.gui.min';
import preloader from './utils/preloader';

/* Custom variables */
var subAvg
var lowAvg
var midAvg
var highAvg

var time = 0
var t = 0
var tprev = t

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
  size: 1,
  transparent: false,
  opacity: .5
}

gui.add(SETTINGS, 'size').min(1).max(100).step(1)
gui.add(SETTINGS, 'transparent')
gui.add(SETTINGS, 'opacity').min(0).max(1).step(.01)

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

/* create and launch main loop */
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


/* -------------------------------------------------------------------------------- */


/**
  Resize canvas
*/
function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}


/// POINTCLOUD THINGY
var cloud

function createParticles(amount, size, transparent, opacity, color) {
    var geom = new THREE.Geometry()
    var material = new THREE.PointsMaterial({
        size: size,
        transparent: transparent,
        opacity: opacity,
        color: color
    })

    var range = 500
    for (var i = 0; i < amount; i++) {
        var particle = new THREE.Vector3(
        	Math.random() * range - range / 2, 
        	Math.random() * range - range / 2, 
        	Math.random() * range - range / 2)
        geom.vertices.push(particle)
        
        var color = new THREE.Color(color)
        color.setHSL(
        	Math.random() * color.getHSL().h, 
        	Math.random() * color.getHSL().s, 
        	Math.random() * color.getHSL().l
        	)
        geom.colors.push(color)
    }

    return new THREE.Points(geom, material) 
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


	var newcolor = new THREE.Color()
	newcolor.setHSL(midAvg, midAvg, subAvg)

	if (cloud) scene.remove(cloud)
	cloud = createParticles(
		Map(subAvg, 0, 1, 10000, 20000),
		Map(midAvg, 0, 1, 1, 6),
		SETTINGS.transparent, 
		SETTINGS.opacity, 
		newcolor
	)
	scene.add(cloud)	


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