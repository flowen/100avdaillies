import * as THREE from 'three'

// post-processing
// import loop from 'raf-loop'
import WAGNER from '@superguigui/wagner'
import BloomPass from '@superguigui/wagner/src/passes/bloom/MultiPassBloomPass'
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass'
import Noise from '@superguigui/wagner/src/passes/noise/noise'
import VignettePass from '@superguigui/wagner/src/passes/vignette/VignettePass'
import DOFPass from '@superguigui/wagner/src/passes/dof/DOFPass'
import resize from 'brindille-resize'

// three.js
import OrbitControls from './controls/OrbitControls'

// particles
import Attractors from './particles/attractors'
import Particles from './particles/particles'

import {SETTINGS} from './utils/gui-controls'

/* Init renderer and canvas */
var renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true } )
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
	distance: 2,
	phi: Math.PI * 0.5,
	distanceBounds: [0, 300]
})

camera.position.set(0, 0, SETTINGS.zMax)
// controls.enabled = false
// controls.enableZoom = false
// controls.autoRotate = true


function onResize() {
	camera.aspect = resize.width / resize.height
	camera.updateProjectionMatrix()
	renderer.setSize(resize.width, resize.height)
	composer.setSize(resize.width, resize.height)
}
onResize()
resize.addListener(onResize)


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

// create a plane for picking up the Raycast
var planeGeom = new THREE.PlaneGeometry(800,200)
var planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff33,
  wireframe: true,
  transparent: true, 
  opacity: 0
})
var plane = new THREE.Mesh(planeGeom, planeMaterial)
plane.position.set(0,0,SETTINGS.zMax-.1)
scene.add(plane)

// raycaster for mouse position
document.addEventListener('mousemove', mouseMove, false);

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

/* make debugging easier */
var axes = new THREE.AxisHelper(20)
scene.add(axes)

function animate() {
	requestAnimationFrame( animate )
	render()
	// stats.update()
}
animate()


// basically the next few variables are all feeders for procedural functions such as noise, movement, etc
var t = 0
var tprev = t

/**
  Render loop
*/

function render(dt) {
	controls.update()
	// camera.position.z = SETTINGS.zMax
	if (SETTINGS.autoZoom) controls.distance = Map(Math.sin(Math.PI * t), -1, 1, 1, 50) + SETTINGS.camDistance
	(SETTINGS.axes === false) ? axes.visible = false : axes.visible = true

	t += .0025
	// smooth the object movement
	tprev = t * .75  // replace with a SETTING

	particles.update()

	// let's draw all particles first and
	var pVertices = particles.points.geometry.vertices
	for (var i = 0; i < pVertices.length; i++) {
		var pVector = pVertices[i]
		
		// than we apply forces of all attractors to particle and calculate direction
		for (var j = 0; j < attractorPos.length; j++) {
			var attraction = attractors.calculateForce(attractor, pVector)
			particles.applyForce(attraction, i)
		}	
	}
	

	renderer.render(scene, camera)
	composer.reset()
	composer.render(scene, camera)
	// composer.pass(bloomPass)

	composer.pass(fxaaPass)
	composer.pass(noise)
	composer.pass(vignette)
	composer.pass(dof)
	composer.toScreen()
}