// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 4096,
    BUFFER_SIZE = 4096,
    audioMonoIO,
    fftResolution,
    timeDomain,
    freqDomain,
    frequencyPeak,
    timeDomainMaxAbsValueAnalyser,
    timeDomainMaxAbsValueRaw,
    domGaugeRaw,
    domGaugeAnalyser,
    domPeakFrequency,
    txFrequency,
    animationFrameFirstCall = true;

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
    timeDomainMaxAbsValueAnalyser = timeDomain[getIndexOfMax(timeDomain, true)];

    domGaugeAnalyser.style.width = (timeDomainMaxAbsValueAnalyser * 100) + '%';
    domPeakFrequency.innerHTML = frequencyPeak.toFixed(2) + ' Hz';
}

function init() {
    var i;

    txFrequency = 2000;

    domPeakFrequency = document.getElementById('peak-frequency');
    domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
    domGaugeAnalyser = document.getElementById('max-absolute-amplitude-gauge-analysernode');

    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);
    fftResolution = audioMonoIO.getSampleRate() / audioMonoIO.getFFTSize();

    audioMonoIO.setSampleInHandler(function (monoIn) {
        timeDomainMaxAbsValueRaw = monoIn[getIndexOfMax(monoIn, true)];
        domGaugeRaw.style.width = (timeDomainMaxAbsValueRaw * 100) + '%';
    });

    audioMonoIO.setSampleOutHandler(function (monoOut, monoIn) {
        for (i = 0; i < monoOut.length; i++) {
            monoOut[i] = 0.05 * (Math.random() * 2 - 1);    // white noise
        }
    });

    audioMonoIO.setPeriodicWave(txFrequency, 0.5);         // 50% volume
    setInterval(function () {
        txFrequency = (txFrequency === 2000 ? 2500 : 2000);
        audioMonoIO.setPeriodicWave(txFrequency, 0.5);         // 50% volume
    }, 1000);

    animationFrameLoop();
}
