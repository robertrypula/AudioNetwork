// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioContext,
    microphone,
    microphoneVirtual,
    toneGenerator,
    toneVolume;

function init() {
    audioContext = new AudioContext();

    // input
    microphoneVirtual = audioContext.createGain();
    connectMicrophoneTo(microphoneVirtual);

    // output
    toneGenerator = audioContext.createOscillator();
    toneVolume = audioContext.createGain();
    updateRandomTone();
    toneGenerator.start();
    toneGenerator.connect(toneVolume);
    setInterval(updateRandomTone, 1000);

    // attach nodes to speakers
    // microphoneVirtual.connect(audioContext.destination);   // Feedback Loop might occur !!!
    toneVolume.connect(audioContext.destination);
}

function outputTone() {
    // TODO depending on flags enable or disable node
}

function updateDestination(node, activate) {
    if (activate) {
        node.connect(audioContext.destination);
    } else {
        node.disconnect(audioContext.destination);
    }
}

function connectMicrophoneTo(microphoneVirtual) {
    var constraints, audioConfig;

    audioConfig = {
        googEchoCancellation: false, // disabling audio processing
        googAutoGainControl: false,
        googNoiseSuppression: false,
        googHighpassFilter: false
    };
    constraints = {
        video: false,
        audio: {
            mandatory: audioConfig,
            optional: []
        }
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            // DO NOT declare 'microphone' variable in scope of this function
            // in some browsers it will be removed by Garbage Collector and 
            // you will hear silence after few seconds
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(microphoneVirtual);
        });
}

function updateRandomTone() {
    var frequency, gain, now;

    now = audioContext.currentTime;

    frequency = 1000 + Math.random() * 2000;
    toneGenerator.frequency.value = frequency;
    toneGenerator.frequency.setValueAtTime(frequency, now);

    gain = Math.random() * 0.01;
    toneVolume.gain.value = gain;
    toneVolume.gain.setValueAtTime(gain, now);
}
