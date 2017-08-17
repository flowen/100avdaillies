import * as THREE from 'three'
import {SETTINGS} from '../utils/gui-controls'

function Particles(num) {
  var geometry = new THREE.Geometry()
  this.acc = []
  this.vel = []

  for (var i = 0; i < num; ++i) {
    var vertex = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, 0)
    geometry.vertices.push(vertex)
    this.acc.push(new THREE.Vector3(.01,.01,.01))
    this.vel.push(new THREE.Vector3(0.0,0.0,0.0))
  }

  var material = new THREE.PointsMaterial({
    size: .01,
    color: 0xffffff
  })

  this.points = new THREE.Points(geometry, material)
}

Particles.prototype.add = function(num) {

}

Particles.prototype.update = function() {
  for (var i = 0; i < this.points.geometry.vertices.length; ++i) {
    var vertex = this.points.geometry.vertices[i]
    var acc = this.acc[i]
    var vel = this.vel[i]
    vel.clampScalar(SETTINGS.clampVELmin,SETTINGS.clampVELmax)
    // if (vertex.z > SETTINGS.zMax) {
    //   vertex.set(
    //     (Math.random() - 0.5), 
    //     (Math.random() - 0.5), 
    //     0)
    // } else {
      vel.add(acc)
      vertex.add(vel)
    // }
  }

  this.points.geometry.verticesNeedUpdate = true
}


// apply force for acceleration
Particles.prototype.applyForce = function(force, i) {
  var f = new THREE.Vector3()
  f.copy(force)

  // f.setLength(0.005)
  var acc = this.acc[i].add(f)
  acc.clampScalar(SETTINGS.clampACCmin,SETTINGS.clampACCmax)
  var vel = this.vel[i].add(acc)

  this.points.geometry.verticesNeedUpdate = true
}

export default Particles