import DAT from '../vendor/dat.gui.min'

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	camDistance: .1,
	autoZoom: false,
	axes: false,
	zMax: 2
}

gui.add(SETTINGS, 'camDistance').min(1).max(100).step(1)
gui.add(SETTINGS, 'autoZoom')
gui.add(SETTINGS, 'axes')
gui.add(SETTINGS, 'zMax').min(1).max(15).step(.1)

export {SETTINGS}