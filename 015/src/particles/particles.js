import * as THREE from 'three'
import {SETTINGS} from '../utils/gui-controls'

function Particles(num) {
  var geometry = new THREE.Geometry()
  this.vel = []
  this.acc = []
  this.clampVEL = .02

  for (var i = 0; i < num; ++i) {
    var vertex = new THREE.Vector3(Math.random(), Math.random(), 0)
    geometry.vertices.push(vertex)
    this.acc.push(new THREE.Vector3())
    this.vel.push(new THREE.Vector3())
  }

  var material = new THREE.PointsMaterial({
    size: .001,
    color: 0xffffff
  })

  // var material = new THREE.MeshPhongMaterial({
  //   shading: THREE.SmoothShading, 
  //   blending: THREE.AdditiveBlending, 
  //   transparent: true, 
  //   color: 0xffffff, 
  //   specular: 0xffffff, 
  //   shininess: 1, 
  //   vertexColors: false  
  // });

  this.points = new THREE.Points(geometry, material)
}

Particles.prototype.add = function(num) {

}

Particles.prototype.update = function() {
  for (var i = 0; i < this.points.geometry.vertices.length; ++i) {
    var vertex = this.points.geometry.vertices[i]
    var acc = this.acc[i]
    var vel = this.vel[i]

    vel.clampScalar(this.clampVEL, this.clampVEL)
    vel.add(acc)
    vertex.add(vel)
  }

  this.points.geometry.verticesNeedUpdate = true
}


// apply force for acceleration
Particles.prototype.applyForce = function(force, i) {
  var f = new THREE.Vector3()
  f.copy(force)
  // f.setLength(0.005)

  var acc = this.acc[i].add(f)
  var vel = this.vel[i].add(acc)
  vel.clampScalar(this.clampVEL, this.clampVEL)

  this.points.geometry.verticesNeedUpdate = true
}

export default Particles