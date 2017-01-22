// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var audioMonoIO, sampleGlobal;

function init() {
    sampleGlobal = 0;
    audioMonoIO = new AudioMonoIO(1024, 1024);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);
}

function sampleOutHandler(monoOut, monoIn) {
    var i, v;

    for (i = 0; i < monoIn.length; i++) {
        v = generateSineWave(
            getSamplePerPeriod(500),
            1,
            0,
            sampleGlobal
        );
        monoOut[i] = v * monoIn[i];

        // monoOut[i] = Math.round(200 * monoIn[i]) / 200;

        sampleGlobal++;
    }
}

// methods from part 1 of the article

function getSamplePerPeriod(frequency) {
    return audioMonoIO.getSampleRate() / frequency;
}

function generateSineWave(samplePerPeriod, amplitude, degreesPhaseOffset, sample) {
    var unitPhaseOffset = degreesPhaseOffset / 360;

    return amplitude * Math.sin(2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset));
}
