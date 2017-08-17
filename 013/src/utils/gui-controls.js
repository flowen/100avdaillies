import DAT from '../vendor/dat.gui.min'

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	vertexMultiplier: 2,
	velocityMultipler: 5,
	camDistance: 10,
	autoZoom: false,
	axes: false,
	zMax: 2,
	maxDisplace: 10
}

gui.add(SETTINGS, 'vertexMultiplier').min(1.0).max(5.0).step(.1)
gui.add(SETTINGS, 'velocityMultipler').min(1.0).max(5.0).step(.1)
gui.add(SETTINGS, 'camDistance').min(1).max(100).step(1)
gui.add(SETTINGS, 'autoZoom')
gui.add(SETTINGS, 'axes')
gui.add(SETTINGS, 'zMax').min(1).max(15).step(.1)
gui.add(SETTINGS, 'maxDisplace').min(5).max(15).step(.1)

export {SETTINGS}