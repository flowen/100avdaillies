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
import perlin from 'perlin-noise'



/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	drawRangeModifier: 1.4,
	scale: .05,
	camDistance: 15
}

gui.add(SETTINGS, 'drawRangeModifier').min(1.05).max(1.55).step(.01)
gui.add(SETTINGS, 'scale').min(.01).max(.1).step(.01)
gui.add(SETTINGS, 'camDistance').min(1).max(100).step(1)

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
	distanceBounds: [0, 300]
})

/* lights */
var ambientLight = new THREE.AmbientLight( 0x000000 )
scene.add( ambientLight )

var lights = []
lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 )
lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 )
lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 )

lights[ 0 ].position.set( 0, 2, 0 )
lights[ 1 ].position.set( 1, 2, 1 )
lights[ 2 ].position.set( -1, -2, -1 )

scene.add( lights[ 0 ] )
scene.add( lights[ 1 ] )
scene.add( lights[ 2 ] )


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

    loader.load(url, onLoad, onProgress, onError)
  })
}

const textureLoader = new THREE.TextureLoader()
function loadTextureAsync (url, onLoad, onProgress, onError) {
  return new Promise ((resolve, reject) => {
    const onProgress = (event) => console.log(`${event.loaded} of ${event.total}`)
    const onLoad = (geometry) => resolve (geometry)
    const onError = (event) => reject (event)

    textureLoader.load(url, onLoad, onProgress, onError)
  })
}

// when finished loading we start the scene
var geoV, nMax, mesh,
	group = new THREE.Group()

// let's create our own pointcloud geometry
var mVertices = 5000,
	geometry = new THREE.Geometry(),
	pnoise = perlin.generatePerlinNoise(3, (mVertices/3))

for (i = 0; i < mVertices; i++) {
    var vertex = new THREE.Vector3()
    vertex.x = pnoise[i] * 250
    vertex.y = pnoise[i+1] * 150
    vertex.z = pnoise[i+2] * 500
    
    geometry.vertices.push(vertex)
}

for (i = 0; i < mVertices-12; i++) {
    geometry.faces.push( new THREE.Face3( i, i+1, i+2 ) )
}

// let's promise all our data
var p1 = loadTextureAsync('./assets/texture.jpg')
var p2 = loadTextureAsync('./assets/normalmap.jpg')

Promise.all([p1, p2])
	.then((data) => {
		var texture = data[0]
		var normals = data[1]
		
		nMax = geometry.vertices.length
		geometry = new THREE.BufferGeometry().fromGeometry( geometry )
		geometry.computeFaceNormals()
		geometry.computeVertexNormals()
		geometry.center()
		geometry.uvsNeedUpdate = true;
		
		var material = new THREE.ShaderMaterial({
			uniforms: {
				tShine: { type: "t", value: texture },
				time: { type: "f", value: 0 },
				weight: { type: "f", value: 0 },
				lows: { type: "f", value: 0 }
			},
			// wireframe:true,
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader').textContent
		})
		// console.log(material)
		
		material.map = normals
		material.bumpScale = 0.5;
		material.bumpMap = normals

		mesh = new THREE.Mesh( geometry, material )
		material.uniforms.tShine.value.uvsNeedUpdate = true;
		// scene.add(mesh)
		// console.log(mesh)

		/*	add as a group instead of a single object*/
		var instance,
			instanceCount = 4,
			distanceInstance = 5

		for (var i = -instanceCount; i < instanceCount; i++ ) {
			for (var j = -instanceCount; j < instanceCount; j++ ) {
				for (var k = -instanceCount; k < instanceCount; k++ ) {
					instance = mesh.clone()
					instance.position.set( i*distanceInstance, j*distanceInstance, k*-distanceInstance )
					group.add( instance )
				}
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

	/* create main loop */
	const engine = loop(render)
	engine.start()
	/* make debugging easier */
	// var axes = new THREE.AxisHelper(20)
	// scene.add(axes)
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
	t += .0025 * tprev

	controls.distance = Map(Math.sin(Math.PI * uTime), -1, 1, 1, 10) + SETTINGS.camDistance
	// console.log(controls.distance)

	// lights[0].position.y += Math.sin(lowAvg) * 10
	// lights[1].position.y += Math.sin(lowAvg) / .2
	// lights[2].position.y += Math.sin(tprev) / .2
	
	// single mesh:
	// mesh.rotation.x = t/80
	// mesh.rotation.y = tprev/50
	// if (subAvg > .9) mesh.material.uniforms.lows.value = 0;
	
	// var maxDrawRange = Math.round(nMax - (lowAvg) * (nMax) * SETTINGS.drawRangeModifier ) 
	// mesh.geometry.setDrawRange( 0, maxDrawRange)

	// mesh.scale.set(.05,.05,.05)

	for (var i = 0; i < group.children.length; i++) {
		var cube = group.children[i]
		cube.scale.set(SETTINGS.scale * lowAvg,SETTINGS.scale * lowAvg,SETTINGS.scale * lowAvg)
		cube.rotation.x = t/(25 * i)
		cube.rotation.y = tprev/100*i

		cube.rotation.x = t/80
		cube.rotation.y = tprev/50

		// cube.material.uniforms.uTime.value = 0.5 + Math.sin(uTime) * lowAvg;
		// cube.material.uniforms.uLows.value = lowAvg;
		// cube.material.uniforms.uMids.value = highAvg;

		var maxDrawRange = Math.round(nMax - (lowAvg) * (nMax) * SETTINGS.drawRangeModifier ) 
		cube.geometry.setDrawRange( 0, maxDrawRange)
	}

	group.rotation.x = t/80
	group.rotation.y = tprev/50


	
	composer.reset()
	composer.render(scene, camera)
	composer.pass(bloomPass)
	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}