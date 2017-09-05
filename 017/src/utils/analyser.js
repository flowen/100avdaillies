import player from './audioplayer';
import createAnalyser from 'web-audio-analyser';
import {SETTINGS} from '../index'

/* create audio analyser */
var audioUtil, analyser;

// from: http://www.teachmeaudio.com/mixing/techniques/audio-spectrum
var bands = {
    sub:  { from: 20,   to: 250 },
    low:  { from: 251,  to: 500 },
    mid:  { from: 501,  to: 3000 },
    high: { from: 3001, to: 6000 }
};

// todo create visual audio analyser in background
var analyserBands = {};
for (var i = 0; i < 12; i++) {
    var prev = i * 285;
    analyserBands[i] = {
        'from'  : prev + 1,
        'to'    : (i+1) * 285
    }
}
// console.log(analyserBands);

/*
    creates analyser for the music player
*/
function analysePlayer() {
    audioUtil = createAnalyser(player.node, player.context, { stereo: false });
    analyser = audioUtil.analyser;
}

/*
    creates analyser for the microphone
*/
function analyseMic() {
    if (!navigator.mediaDevices) return false;
    navigator.mediaDevices.getUserMedia ({audio: true, video: false})
        .then((stream) => {
            audioUtil = createAnalyser(stream, null, {stereo: false });
            analyser = audioUtil.analyser;
        })
        .catch((err) => {
            console.log(err)
        });
}


export { audioUtil, analyser, bands, analyserBands, analysePlayer, analyseMic };