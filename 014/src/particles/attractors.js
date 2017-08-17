import * as THREE from 'three'
import {SETTINGS} from '../utils/gui-controls'
import h from '../utils/helpers'

function Attractors(num) {
  var geometry = new THREE.BoxGeometry(.1,.1,.1)
  var material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
  })
  
  var group = new THREE.Group()

  for (var i = 0; i < num; ++i) {
    var m = new THREE.Mesh(geometry, material)

    m.position.set(
      h.getRandomFloat(-.5, .5), 
      h.getRandomFloat(-.5, .5),
      SETTINGS.zMax
    )

    group.add(m) 
  }
  
  this.group = () => { return group }
  
  this.calculateForce = (aVector, pVector) => {
    var f = new THREE.Vector3()
    var force = f.subVectors(aVector, pVector)
    var distance = force.length()

    force.multiplyScalar(distance)
    return force
  }
}

export default Attractors