import DAT from '../vendor/dat.gui.min'

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	camDistance: 2,
	autoRotateCam: true,
	autoZoomCam: true,
	axes: false,
	tsmooth: .75,
}

gui.add(SETTINGS, 'camDistance').min(1).max(50).step(1)
gui.add(SETTINGS, 'autoRotateCam')
gui.add(SETTINGS, 'autoZoomCam')
gui.add(SETTINGS, 'axes')

export {SETTINGS}