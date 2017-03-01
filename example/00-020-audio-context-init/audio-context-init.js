// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    microphoneCheckbox,
    toneCheckbox,
    audioContext,
    microphone,
    microphoneVirtual,
    toneGenerator,
    toneVolume;

function init() {
    audioContext = new AudioContext();

    // DOM elements
    microphoneCheckbox = document.getElementById('output-microphone-checkbox');
    toneCheckbox = document.getElementById('tone-checkbox');

    // input
    microphoneVirtual = audioContext.createGain();
    connectMicrophoneTo(microphoneVirtual);

    // output
    toneGenerator = audioContext.createOscillator();
    toneVolume = audioContext.createGain();
    toneGenerator.start();
    toneGenerator.connect(toneVolume);
    updateTone();
    setInterval(updateTone, 1000);

    // connect nodes to the destination
    if (microphoneCheckbox.checked) {
        microphoneVirtual.connect(audioContext.destination);
    }
    if (toneCheckbox.checked) {
        toneVolume.connect(audioContext.destination);
    }
}

function onMicrophoneCheckboxChange() {
    updateDestination(microphoneVirtual, microphoneCheckbox);
}

function onToneCheckboxChange() {
    updateDestination(toneVolume, toneCheckbox);
}

function updateDestination(audioNode, domElement) {
    if (domElement.checked) {
        audioNode.connect(audioContext.destination);
    } else {
        audioNode.disconnect(audioContext.destination);
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

function updateTone() {
    var frequency, gain, now;

    now = audioContext.currentTime;

    frequency = 1000 + Math.random() * 2000;
    toneGenerator.frequency.value = frequency;
    toneGenerator.frequency.setValueAtTime(frequency, now);

    gain = Math.random() * 0.01;
    toneVolume.gain.value = gain;
    toneVolume.gain.setValueAtTime(gain, now);
}
