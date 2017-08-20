import DAT from '../vendor/dat.gui.min'

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	axes: false,
	followMouse: false,
	tsmooth: .75,
	clampVEL: .02
}

gui.add(SETTINGS, 'axes')
gui.add(SETTINGS, 'followMouse')
gui.add(SETTINGS, 'tsmooth').min(.01).max(1).step(.01)
gui.add(SETTINGS, 'clampVEL').min(.001).max(1).step(.001)

export {SETTINGS}