/*
	DAT GUI

	TODO: bass/mid/hi frequencies 
*/

import * as dat from 'dat-gui';

var dcontrols = new function() {
     this.forceMultiplier = 1;
     this.particlesAlpha = 15;
     this.attractorAlpha = 0;
     this.fBassMin = 0;
     this.fBassMax = 70;
     this.bth = .7;
     this.fMidMin = 80;
     this.fMidMax = 120;
     this.mth = .7;
}

window.onload = function() {
    var datGui = new dat.GUI();
    // datGui.add(dcontrols, 'forceMultiplier', 0, 3);
    // datGui.add(dcontrols, 'particlesAlpha', 0, 55);
    // datGui.add(dcontrols, 'attractorAlpha', 0, 255);
    // datGui.add(dcontrols, 'fBassMin', 0, 50);
    // datGui.add(dcontrols, 'fBassMax', 50, 90);
    // datGui.add(dcontrols, 'bth', 0.5, 1);
    // datGui.add(dcontrols, 'fMidMin', 80, 120);
    // datGui.add(dcontrols, 'fMidMax', 100, 150);
    // datGui.add(dcontrols, 'mth', 0.5, 1);


    gui.add(controls, 'radius', 0, 40).onChange(controls.redraw);
    gui.add(controls, 'tube', 0, 40).onChange(controls.redraw);
    gui.add(controls, 'radialSegments', 0, 400).step(1).onChange(controls.redraw);
    gui.add(controls, 'tubularSegments', 1, 20).step(1).onChange(controls.redraw);
    gui.add(controls, 'p', 1, 10).step(1).onChange(controls.redraw);
    gui.add(controls, 'q', 1, 15).step(1).onChange(controls.redraw);
    gui.add(controls, 'heightScale', 0, 5).onChange(controls.redraw);
    gui.add(controls, 'asParticles').onChange(controls.redraw);
    gui.add(controls, 'rotate').onChange(controls.redraw);

    controls.redraw();

    // datGui.remember(dcontrols);
}


//STATS
stats = new Stats();
$('#controls').append(stats.domElement);
stats.domElement.id = "stats";


export default dat;