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
import { audioUtil, analyser, bands } from './utils/analyser'

import h from './utils/helpers'
import DAT from './vendor/dat.gui.min'
import preloader from './utils/preloader';


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

/* lights */
// var ambientLight = new THREE.AmbientLight( 0x000000 )
// scene.add( ambientLight )

// var lights = []
// lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 )
// lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 )
// lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 )

// lights[ 0 ].position.set( 0, 2, 0 )
// lights[ 1 ].position.set( 1, 2, 1 )
// lights[ 2 ].position.set( -1, -2, -1 )

// scene.add( lights[ 0 ] )
// scene.add( lights[ 1 ] )
// scene.add( lights[ 2 ] )


// UNIFORMS FOR DA SHADER
var uniforms = {
	uLows: { value: 1.0 },
	uMids: { value: 1.0 },
	uTime: { value: 1.0 },
	uMouse: { value: new THREE.Vector2() }
}

// uMouse
container.onmousemove = function (e) {
	uniforms.uMouse.value.x = e.pageX / renderer.domElement.width;
	uniforms.uMouse.value.y = e.pageY / renderer.domElement.height;
}

// uResolution
function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}
onResize()
resize.addListener(onResize)

////////////////////////////////////////////////////////////////////////////////////
/////// magic stuff


// load it async
const loader = new THREE.JSONLoader()
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
var geoV, nMax, mesh,
	group = new THREE.Group()

loadJsonAsync('assets/cube.json')
	.then((geometry) => {
		nMax = geometry.vertices.length
		geometry = new THREE.BufferGeometry().fromGeometry( geometry )
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader').textContent
		})

		mesh = new THREE.Mesh( geometry, material )
		scene.add(mesh)
		var instance
		for (var i = -15; i < 15; i++ ) {
			for (var j = -15; j < 15; j++ ) {
				instance = mesh.clone()
				instance.position.set( i*30, 0, j*30 )
				group.add( instance )
			}
		}
		scene.add(group)
		
		// everyting loaded, ikimasho!
		init()
	})

	
function init() {
	// TODO: show and remove some loader
	// and start the music
	player.play()

	// set cam
	camera.position.x = 2
	camera.position.y = 2
	camera.position.z = 3
	camera.setFocalLength ( 50 )
	// camera.lookAt( new THREE.Vector3(0,0,0)  )

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
}


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
	t += .0025 + lowAvg

	mesh.material.uniforms.uTime.value = 0.5 + Math.sin(uTime) * lowAvg;
	mesh.material.uniforms.uLows.value = lowAvg;
	mesh.material.uniforms.uMids.value = highAvg;

	for (var i = 0; i < group.children.length; i++) {
		var tree = group.children[i]
		var maxDrawRange = Math.round(nMax - (lowAvg)*(nMax) ) 
		tree.geometry.setDrawRange( 0, maxDrawRange)
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