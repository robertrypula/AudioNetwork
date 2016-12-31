// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var audioMonoIO, fftResolution, timeDomain, freqDomain, frequencyPeak, domGaugeRaw, domGaugeAnalyser, domPeakFrequency, txFrequency, animationFrameFirstCall = true;

function getIndexOfMax(data, useAbsValue) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = useAbsValue ? Math.abs(data[i]) : data[i];
        if (i === 0 || value > max) {
            max = value;
            maxIndex = i;
        }
    }

    return maxIndex;
}

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        nextAnimationFrame();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

function nextAnimationFrame() {
    timeDomain = audioMonoIO.getTimeDomainData();
    freqDomain = audioMonoIO.getFrequencyData();
    frequencyPeak = getIndexOfMax(freqDomain, false) * fftResolution;

    domGaugeAnalyser.style.width = (timeDomain[getIndexOfMax(timeDomain, true)] * 100) + '%';
    domPeakFrequency.innerHTML = frequencyPeak.toFixed(2) + ' Hz';
}

function init() {
    txFrequency = 2000;

    domPeakFrequency = document.getElementById('peak-frequency');
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    audioMonoIO = new AudioMonoIO(4096, 4096);
    fftResolution = audioMonoIO.getSampleRate() / audioMonoIO.getFFTSize();

    audioMonoIO.setSampleInHandler(function (dataIn) {
        domGaugeRaw.style.width = (timeDomain[getIndexOfMax(dataIn, true)] * 100) + '%';
    });

    audioMonoIO.setSampleOutHandler(function (dataOut, dataIn) {
        for (var i = 0; i < dataOut.length; i++) {
            dataOut[i] = 0.05 * (Math.random() * 2 - 1);
        }
    });

    setInterval(function () {
        audioMonoIO.setOutputWave(txFrequency, 0.5);
        txFrequency = txFrequency === 2000 ? 2500 : 2000;
    }, 1000);

    animationFrameLoop();
}
