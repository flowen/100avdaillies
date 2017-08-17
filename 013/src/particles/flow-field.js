import * as THREE from 'three'
import Perlin from 'perlin-simplex'

var noise = new Perlin()

function computeNoise(x, y, z) {
  var eps = 1.0
  var n1, n2, a, b
  var curl = new THREE.Vector3()

  n1 = noise.noise3d(x, y + eps, z)
  n2 = noise.noise3d(x, y - eps, z)

  a = (n1 - n2) / (2 * eps)

  n1 = noise.noise3d(x, y, z + eps)
  n2 = noise.noise3d(x, y, z - eps)

  b = (n1 - n2) / (2 * eps)

  curl.x = a - b

  n1 = noise.noise3d(x, y, z + eps)
  n2 = noise.noise3d(x, y, z - eps)

  a = (n1 - n2)/(2 * eps)

  n1 = noise.noise3d(x + eps, y, z)
  n2 = noise.noise3d(x + eps, y, z)

  b = (n1 - n2)/(2 * eps)

  curl.y = a - b

  n1 = noise.noise3d(x + eps, y, z)
  n2 = noise.noise3d(x - eps, y, z)

  a = (n1 - n2)/(2 * eps)

  n1 = noise.noise3d(x, y + eps, z)
  n2 = noise.noise3d(x, y - eps, z)

  b = (n1 - n2)/(2 * eps)

  curl.z = 1

  return curl
}


function FlowField(xsize,ysize,zsize) {
  this.field = []
  this.xsize = xsize
  this.ysize = ysize
  this.zsize = zsize

  for (var x = 0; x < xsize; ++x) {
    this.field[x] = []

    for (var y = 0; y < ysize; ++y) {
      this.field[x][y] = []

      for (var z = 0; z < zsize; ++z) {
        var mod = 0.07

        this.field[x][y][z] = computeNoise(x * mod, y * mod, z * mod)
      }
    }
  }
}

FlowField.prototype.sample = function(x, y, z) {
  x = Math.round(x) + this.xsize / 5
  y = Math.round(y) + this.ysize / 5
  z = Math.round(z) + this.zsize / 5

  return (this.field[x] && this.field[x][y] && this.field[x][y][z]) ? this.field[x][y][z] : undefined
}

export default FlowField
