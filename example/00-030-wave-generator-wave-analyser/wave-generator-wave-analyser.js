// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    DIGIT_BEFORE_THE_DOT = 5,
    DIGIT_AFTER_THE_DOT = 3,
    INITIAL_FREQUENCY_HERTZ = 1500,
    INITIAL_RX_WINDOW_SIZE = 2048,
    INITIAL_TX_AMPLITUDE = 0.01,
    INITIAL_TX_PHASE = 0,
    domLoopbackCheckbox,
    domTxActivatedCheckbox,
    domRxActivatedCheckbox,
    domRxWindowFunctionCheckbox,
    audioMonoIO,
    waveAnalyser,
    waveGenerate,
    txFrequencyHertz,
    txFrequencySamplePerPeriod,
    txAmplitude,
    txPhase,
    rxFrequencyHertz,
    rxFrequencyCyclePerWindow,
    rxFrequencySamplePerPeriod,
    rxWindowSize,
    rxSampleCounter = 0;

function init(useLite, bufferSize) {
    if (!useLite) {
        audioMonoIO = new AudioMonoIO(AudioMonoIO.FFT_SIZE, bufferSize);
    } else {
        audioMonoIO = new AudioMonoIOLite(bufferSize);
    }

    document.getElementById('sample-rate').innerHTML = audioMonoIO.getSampleRate();

    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domTxActivatedCheckbox = document.getElementById('tx-activated');
    txFrequencyHertz = new EditableFloatWidget(
        document.getElementById('tx-frequency-hertz'),
        INITIAL_FREQUENCY_HERTZ, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxFrequencyHertzChange
    );
    txFrequencySamplePerPeriod = new EditableFloatWidget(
        document.getElementById('tx-frequency-sample-per-period'),
        getSamplePerPeriodFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxFrequencySamplePerPeriodChange
    );
    txAmplitude = new EditableFloatWidget(
        document.getElementById('tx-amplitude'),
        INITIAL_TX_AMPLITUDE, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxAmplitudeChange
    );
    txPhase = new EditableFloatWidget(
        document.getElementById('tx-phase'),
        INITIAL_TX_PHASE, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxPhaseChange
    );
    domRxActivatedCheckbox = document.getElementById('rx-activated');
    rxWindowSize = new EditableFloatWidget(
        document.getElementById('rx-window-size'),
        INITIAL_RX_WINDOW_SIZE, DIGIT_BEFORE_THE_DOT, 0,
        onRxWindowSizeChange
    );
    rxFrequencyHertz = new EditableFloatWidget(
        document.getElementById('rx-frequency-hertz'),
        INITIAL_FREQUENCY_HERTZ, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onRxFrequencyHertzChange
    );
    rxFrequencyCyclePerWindow = new EditableFloatWidget(
        document.getElementById('rx-frequency-cycle-per-window'),
        getCyclePerWindowFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onRxFrequencyCyclePerWindowChange
    );
    rxFrequencySamplePerPeriod = new EditableFloatWidget(
        document.getElementById('rx-frequency-sample-per-period'),
        getSamplePerPeriodFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onRxFrequencySamplePerPeriodChange
    );
    domRxWindowFunctionCheckbox = document.getElementById('rx-window-function');

    waveGenerate = new WaveGenerate(
        txFrequencySamplePerPeriod.getValue()
    );
    waveGenerate.setAmplitude(txAmplitude.getValue());
    waveGenerate.setUnitPhase(txPhase.getValue());

    waveAnalyser = new WaveAnalyser(
        rxFrequencySamplePerPeriod.getValue(),
        rxWindowSize.getValue(),
        domRxWindowFunctionCheckbox.checked
    );

    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    onLoopbackCheckboxChange();
}

// -----------------------------------------------------------------------

function getSamplePerPeriodFromHertz(hertz) {
    return audioMonoIO.getSampleRate() / hertz;
}

function getHertzFromSamplePerPeriod(samplePerPeriod) {
    return audioMonoIO.getSampleRate() / samplePerPeriod;
}

function getCyclePerWindowFromHertz(hertz) {
    return hertz * rxWindowSize.getValue() / audioMonoIO.getSampleRate();
}

function getHertzFromCyclePerWindow(cyclePerWindow) {
    return cyclePerWindow * audioMonoIO.getSampleRate() / rxWindowSize.getValue();
}

function getSamplePerPeriodFromCyclePerWindow(cyclePerWindow) {
    return rxWindowSize.getValue() / cyclePerWindow;
}

function getCyclePerWindowFromSamplePerPeriod(samplePerPeriod) {
    return rxWindowSize.getValue() / samplePerPeriod;
}

// -----------------------------------------------------------------------

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

function onTxFrequencyHertzChange(hertz) {
    if (waveGenerate) {
        txFrequencySamplePerPeriod.setValue(getSamplePerPeriodFromHertz(hertz));
        waveGenerate.setSamplePerPeriod(txFrequencySamplePerPeriod.getValue());
    }
}

function onTxFrequencySamplePerPeriodChange(samplePerPeriod) {
    if (waveGenerate) {
        txFrequencyHertz.setValue(getHertzFromSamplePerPeriod(samplePerPeriod));
        waveGenerate.setSamplePerPeriod(txFrequencySamplePerPeriod.getValue());
    }
}

function onTxActivatedCheckboxChange() {
    audioMonoIO.setVolume(
        domTxActivatedCheckbox.checked ? 1 : 0
    );
}

function onTxAmplitudeChange(value) {
    if (waveGenerate) {
        waveGenerate.setAmplitude(value)
    }
}

function onTxPhaseChange(value) {
    if (waveGenerate) {
        waveGenerate.setUnitPhase(value)
    }
}

function onRxFrequencyHertzChange(hertz) {
    if (waveAnalyser) {
        rxFrequencyCyclePerWindow.setValue(getCyclePerWindowFromHertz(hertz));
        rxFrequencySamplePerPeriod.setValue(getSamplePerPeriodFromHertz(hertz));
        waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
    }
}

function onRxFrequencyCyclePerWindowChange(cyclePerWindow) {
    if (waveAnalyser) {
        rxFrequencyHertz.setValue(getHertzFromCyclePerWindow(cyclePerWindow));
        rxFrequencySamplePerPeriod.setValue(getSamplePerPeriodFromCyclePerWindow(cyclePerWindow));
        waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
    }
}

function onRxFrequencySamplePerPeriodChange(samplePerPeriod) {
    if (waveAnalyser) {
        rxFrequencyHertz.setValue(getHertzFromSamplePerPeriod(samplePerPeriod));
        rxFrequencyCyclePerWindow.setValue(getCyclePerWindowFromSamplePerPeriod(samplePerPeriod));
        waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
    }
}

function onRxWindowSizeChange(windowSize) {
    if (waveAnalyser) {
        waveAnalyser.setWindowSize(windowSize);
        rxFrequencyCyclePerWindow.setValue(
            getCyclePerWindowFromHertz(
                rxFrequencyHertz.getValue()
            )
        );
    }
}

function onRxWindowFunctionChange() {
    waveAnalyser.setWindowFunction(
        domRxWindowFunctionCheckbox.checked
    );
}

// ------------------------

function sampleOutHandler(monoOut) {
    var i, sample;

    if (!domTxActivatedCheckbox.checked) {
        return;
    }

    for (i = 0; i < monoOut.length; i++) {
        sample = waveGenerate.getSample();
        waveGenerate.nextSample();

        monoOut[i] = sample;
    }
}

function getWidthFromDecibel(decibel) {
    var width;

    width = 100 + decibel;
    width = width < 0 ? 0 : width;
    width = width > 100 ? 100 : width;
    
    return width;
}

function sampleInHandler(monoIn) {
    var i, sample, width;

    if (!domRxActivatedCheckbox.checked) {
        return;
    }

    for (i = 0; i < monoIn.length; i++) {
        sample = monoIn[i];
        waveAnalyser.handle(sample);
        rxSampleCounter++;

        if (rxSampleCounter % rxWindowSize.getValue() === 0) {
            var log =
                'Amplitude: ' + waveAnalyser.getAmplitude().toFixed(6) + '<br/>' +
                'Phase: ' + waveAnalyser.getUnitPhase().toFixed(3) + '<br/>' +
                'Decibel: ' + waveAnalyser.getDecibel().toFixed(3);

            document.getElementById('log').innerHTML = log;

            width = getWidthFromDecibel(waveAnalyser.getDecibel());
            document.getElementById('power-bar').style.width = width + '%';
            document.getElementById('phase').style.transform = 'rotate(' + (-waveAnalyser.getUnitPhase() * 360) + 'deg)';
        }
    }
}
