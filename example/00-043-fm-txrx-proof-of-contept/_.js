// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioMonoIO,
    sampleNumber,
    carrierFrequency,
    frequencyOffset,
    fmRange,
    baseband,
    basebandFrequency,
    t;

function initTx() {
    audioMonoIO = new AudioMonoIO();

    audioMonoIO.setVolume(0.01);

    sampleNumber = 0;
    carrierFrequency = 3000;
    basebandFrequency = 4;
    fmRange = 5;
    audioMonoIO.setSampleOutHandler(function (monoOut) {
        var t, i;

        for (i = 0; i < monoOut.length; i++) {
            t = 2 * Math.PI * sampleNumber/audioMonoIO.getSampleRate();
            baseband = Math.sin(t * basebandFrequency);
            frequencyOffset = baseband * fmRange;
            monoOut[i] = Math.sin(t * carrierFrequency + frequencyOffset);
            sampleNumber++;
        }
    });
}

function initRx() {
    // Inphase (cos) oscillator - fCarrier
    // Quadrature (sin) oscillator - fCarrier
    // baseband oscillator         - 5 Hz
    // channel merger all above into one
    // scriptprocessor node: mix those frequencies
    // biquad filter to filter out
    /*
     (a + bi)*(c + di) = ac + adi + bci - bd = (ac - bd) + (ad + bc)i

     (cosCarrX + sinCarrYi)*(cosBaseX + sinBaseYi)
     RealPart =
     A*A*e^(i)
     */
}
