import DAT from '../vendor/dat.gui.min'

/* DAT gui */
const gui = new DAT.GUI()

const SETTINGS = {
	camDistance: 10,
	autoRotateCam: false,
	axes: false,
	iAttractions: 3,
	clampACCmin: -5,
	clampACCmax: 5,
	clampVELmin: -5,
	clampVELmax: 5,
	automateClamps: false
}

gui.add(SETTINGS, 'camDistance').min(10).max(50).step(1)
gui.add(SETTINGS, 'autoRotateCam')
gui.add(SETTINGS, 'axes')
gui.add(SETTINGS, 'iAttractions').min(1).max(15).step(1)
gui.add(SETTINGS, 'clampACCmin').min(-10).max(0).step(1).listen()
gui.add(SETTINGS, 'clampACCmax').min(0).max(10).step(1).listen()
gui.add(SETTINGS, 'clampVELmin').min(-10).max(0).step(1).listen()
gui.add(SETTINGS, 'clampVELmax').min(0).max(10).step(1).listen()
gui.add(SETTINGS, 'automateClamps')

export {SETTINGS}