import * as THREE from 'three'
import {SETTINGS} from '../utils/gui-controls'

function Particles(num) {
  var geometry = new THREE.Geometry()
  this.velocities = []

  for (var i = 0; i < num; ++i) {
    var vertex = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, 0)
    geometry.vertices.push(vertex)

    this.velocities.push(new THREE.Vector3(
      0,
      0,
      0.05
    ))
  }

  var material = new THREE.PointsMaterial({
    size: .001,
    color: 0xffffff
  })

  this.points = new THREE.Points(geometry, material)
}

Particles.prototype.add = function(num) {

}

Particles.prototype.update = function() {
  for (var i = 0; i < this.points.geometry.vertices.length; ++i) {
    var vertex = this.points.geometry.vertices[i]
    var velocity = this.velocities[i]

    if (vertex.z > SETTINGS.zMax) {
      vertex.set(
        (Math.random() - 0.5), 
        (Math.random() - 0.5), 
        0)
    } else {
      vertex.add(velocity)
    }
  }

  this.points.geometry.verticesNeedUpdate = true
}


// apply force for acceleration
Particles.prototype.applyForce = function(force, i) {
  var f = new THREE.Vector3()
  f.copy(force)

  f.setLength(0.005)
  var vel = this.velocities[i].add(f)
  vel.clampScalar(-.001,.001)
  this.velocities[i] = vel.add(f)

  this.points.geometry.verticesNeedUpdate = true
}

export default Particles