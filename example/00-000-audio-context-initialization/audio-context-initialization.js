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
    microphoneVirtual.connect(audioContext.destination);
    toneVolume.connect(audioContext.destination);
}

function connectMicrophoneTo(node) {
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
            // DO NOT declare this variable in scope of this function
            // in some browsers it's removed by Garbage Collector
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(node);
        });
}

function updateRandomTone() {
    var frequency, gain, now;

    now = audioContext.currentTime;

    frequency = 1000 + Math.random() * 2000;
    toneGenerator.frequency.value = frequency;
    toneGenerator.frequency.setValueAtTime(frequency, now);

    gain = 0.001 + Math.random() * 0.01;
    toneVolume.gain.value = gain;
    toneVolume.gain.setValueAtTime(gain, now);

}
