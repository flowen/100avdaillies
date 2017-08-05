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
import audioPlayer from 'web-audio-player';
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
  radius: 40,
  tube: 43,
  radialSegments: 72,
  tubularSegments: 36
}

gui.add(SETTINGS, 'radius').min(0).max(100).step(1)
gui.add(SETTINGS, 'tube').min(0).max(100).step(1)
gui.add(SETTINGS, 'radialSegments').min(0).max(200).step(1)
gui.add(SETTINGS, 'tubularSegments').min(0).max(200).step(1)


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
const engine = loop(render)
engine.start()


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
function generateSprite() {
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.2, 'rgba(149, 205, 199 , .7)');
    gradient.addColorStop(0.6, 'rgba(118,173,167,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return texture;
}

function createPointCloud(geom) {
    var material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 3,
        transparent: true,
        blending: THREE.AdditiveBlending,
        map: generateSprite()
    });

    var cloud = new THREE.Points(geom, material);
    cloud.sortParticles = true;
    
    return cloud;
}

function createMesh(geom) {
    // assign two materials
    var meshMaterial = new THREE.MeshNormalMaterial({});
    meshMaterial.side = THREE.DoubleSide;

    // create a multimaterial
    var mesh = THREE.SceneUtils.createMultiMaterialObject(geom, [meshMaterial]);

    return mesh;
}

var knot, geom

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

	controls.distance = Map(Math.sin(Math.PI * time)+1, 1, 2, 200, 225)

	if (knot) scene.remove(knot)
	var knotR = Math.sin(-tprev) + SETTINGS.radius
	// var knotR = 30
	// var knottS = Map( , 0, 1, 5, 15)
	// console.log(knotR)
	// console.log()
	geom = new THREE.TorusKnotGeometry(
					knotR, 
					SETTINGS.tube,
					Math.round(SETTINGS.radialSegments), 
					Math.round(SETTINGS.tubularSegments), 
					Math.sin(time * (highAvg*.5)),
					Math.cos(time * lowAvg)
					)

	knot = createPointCloud(geom)

	scene.add(knot)

	// knot.rotation.x = Math.sin(time)
	knot.rotation.y = Math.cos(time)
	knot.rotation.z += .05

	// wireframeG.rotation.x = Math.sin(Math.PI * .5) + t/100
	// wireframeG.rotation.y = Math.cos(Math.PI * .5) + t/100
	// wireframeG.rotation.z -= .0025


	/* camera */
	camera.lookAt(knot.position)
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