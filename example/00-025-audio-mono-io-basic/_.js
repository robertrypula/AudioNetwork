/* ... */
function nextAnimationFrame() {
    timeDomain = audioMonoIO.getTimeDomainData();
    freqDomain = audioMonoIO.getFrequencyData();
    frequencyPeak = getIndexOfMax(freqDomain) * fftResolution;
    timeDomainMaxAbsValueAnalyser = timeDomain[getIndexOfMaxAbs(timeDomain)];

    domGaugeAnalyser.style.width = (timeDomainMaxAbsValueAnalyser * 100) + '%';
    domPeakFrequency.innerHTML = frequencyPeak.toFixed(2) + ' Hz';

    requestAnimationFrame(nextAnimationFrame);
}

function init() {
    txFrequency = 2000;
    /* ... */
    audioMonoIO = new AudioMonoIO(4096, 4096);  // fftSize, bufferSize
    fftResolution = audioMonoIO.getSampleRate() / audioMonoIO.getFFTSize();

    audioMonoIO.setSampleInHandler(function (monoIn) {
        timeDomainMaxAbsValueRaw = monoIn[getIndexOfMaxAbs(monoIn)];
        domGaugeRaw.style.width = (timeDomainMaxAbsValueRaw * 100) + '%';
    });

    audioMonoIO.setSampleOutHandler(function (monoOut, monoIn) {
        for (var i = 0; i < monoOut.length; i++) {
            monoOut[i] = 0.05 * (Math.random() * 2 - 1);  // biały szum
            /* możliwe jest także użycie sampli z mikrofonu:
             monoOut[i] += 0.1 * monoIn[i]; */
        }
    });

    audioMonoIO.setPeriodicWave(txFrequency, 0.5);  // głośność 50%
    setInterval(function () {
        txFrequency = (txFrequency === 2000 ? 2500 : 2000);
        audioMonoIO.setPeriodicWave(txFrequency, 0.5);  // głośność 50%
    }, 1000);
    /* ... */
}
