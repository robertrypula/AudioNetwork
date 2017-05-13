// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    DIGIT_BEFORE_THE_DOT = 5,
    DIGIT_AFTER_THE_DOT = 3,
    INITIAL_FREQUENCY_HERTZ = 1500,
    INITIAL_RX_WINDOW_SIZE = 2024,
    INITIAL_TX_AMPLITUDE = 0.01,
    INITIAL_TX_PHASE = 0,
    domLoopbackCheckbox,
    domTxActivatedCheckbox,
    domRxActivatedCheckbox,
    domRxWindowFunctionCheckbox,
    audioMonoIO,
    waveAnalyser,
    waveGenerate,
    txFrequency,
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

    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domTxActivatedCheckbox = document.getElementById('tx-activated');
    txFrequency = new EditableFloatWidget(
        document.getElementById('tx-frequency'),
        INITIAL_FREQUENCY_HERTZ, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxFrequencyChange
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

    waveAnalyser = new WaveAnalyser(
        rxFrequencySamplePerPeriod.getValue(),
        rxWindowSize.getValue(),
        domRxWindowFunctionCheckbox.checked
    );
    waveGenerate = new WaveGenerate(
        getSamplePerPeriod(audioMonoIO.getSampleRate(), txFrequency.getValue())
    );
    waveGenerate.setAmplitude(txAmplitude.getValue());
    waveGenerate.setUnitPhase(txPhase.getValue());
    
    audioMonoIO.setSampleInHandler(sampleInHandler);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    onLoopbackCheckboxChange();
}

// -----------------------------------------------------------------------

function getSamplePerPeriod(samplePerOneCycle, cycle) {
    return samplePerOneCycle / cycle;
}

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
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);    // TODO fix loop back issues
    }
}

function onTxFrequencyChange(value) {
    if (waveGenerate) {
        waveGenerate.setSamplePerPeriod(
            getSamplePerPeriod(audioMonoIO.getSampleRate(), value)
        );
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

function onRxWindowSizeChange(value) {
    if (waveAnalyser) {
        waveAnalyser.setWindowSize(value);
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

function sampleInHandler(monoIn) {
    var i, sample;

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
            document.getElementById('phase').style.transform = 'rotate(' + (-waveAnalyser.getUnitPhase() * 360) + 'deg)';
        }
    }
}
