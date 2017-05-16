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
    frequencyCalculator,
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
    audioMonoIO = useLite
        ? new AudioMonoIOLite(bufferSize)
        : new AudioMonoIO(AudioMonoIO.FFT_SIZE, bufferSize);

    frequencyCalculator = new FrequencyCalculator(
        function () {
            return audioMonoIO.getSampleRate();
        },
        function () {
            return rxWindowSize.getValue();
        }
    );

    document.getElementById('sample-rate').innerHTML = audioMonoIO.getSampleRate();
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domTxActivatedCheckbox = document.getElementById('tx-activated');
    domRxActivatedCheckbox = document.getElementById('rx-activated');
    domRxWindowFunctionCheckbox = document.getElementById('rx-window-function');

    initFloatWidget();

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

function initFloatWidget() {
    txFrequencyHertz = new EditableFloatWidget(
        document.getElementById('tx-frequency-hertz'),
        INITIAL_FREQUENCY_HERTZ, DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onTxFrequencyHertzChange
    );
    txFrequencySamplePerPeriod = new EditableFloatWidget(
        document.getElementById('tx-frequency-sample-per-period'),
        frequencyCalculator.getSamplePerPeriodFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
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
        frequencyCalculator.getCyclePerWindowFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onRxFrequencyCyclePerWindowChange
    );
    rxFrequencySamplePerPeriod = new EditableFloatWidget(
        document.getElementById('rx-frequency-sample-per-period'),
        frequencyCalculator.getSamplePerPeriodFromHertz(INITIAL_FREQUENCY_HERTZ), DIGIT_BEFORE_THE_DOT, DIGIT_AFTER_THE_DOT,
        onRxFrequencySamplePerPeriodChange
    );
}

// -----------------------------------------------------------------------

function onLoopbackCheckboxChange() {
    if (audioMonoIO) {
        audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
    }
}

function onTxFrequencyHertzChange(hertz) {
    txFrequencySamplePerPeriod.setValue(frequencyCalculator.getSamplePerPeriodFromHertz(hertz));
    waveGenerate.setSamplePerPeriod(txFrequencySamplePerPeriod.getValue());
}

function onTxFrequencySamplePerPeriodChange(samplePerPeriod) {
    txFrequencyHertz.setValue(frequencyCalculator.getHertzFromSamplePerPeriod(samplePerPeriod));
    waveGenerate.setSamplePerPeriod(txFrequencySamplePerPeriod.getValue());
}

function onTxActivatedCheckboxChange() {
    audioMonoIO.setVolume(
        domTxActivatedCheckbox.checked ? 1 : 0
    );
}

function onTxAmplitudeChange(value) {
    waveGenerate.setAmplitude(value)
}

function onTxPhaseChange(value) {
    waveGenerate.setUnitPhase(value)
}

function onRxFrequencyHertzChange(hertz) {
    rxFrequencyCyclePerWindow.setValue(frequencyCalculator.getCyclePerWindowFromHertz(hertz));
    rxFrequencySamplePerPeriod.setValue(frequencyCalculator.getSamplePerPeriodFromHertz(hertz));
    waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
}

function onRxFrequencyCyclePerWindowChange(cyclePerWindow) {
    rxFrequencyHertz.setValue(frequencyCalculator.getHertzFromCyclePerWindow(cyclePerWindow));
    rxFrequencySamplePerPeriod.setValue(frequencyCalculator.getSamplePerPeriodFromCyclePerWindow(cyclePerWindow));
    waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
}

function onRxFrequencySamplePerPeriodChange(samplePerPeriod) {
    rxFrequencyHertz.setValue(frequencyCalculator.getHertzFromSamplePerPeriod(samplePerPeriod));
    rxFrequencyCyclePerWindow.setValue(frequencyCalculator.getCyclePerWindowFromSamplePerPeriod(samplePerPeriod));
    waveAnalyser.setSamplePerPeriod(rxFrequencySamplePerPeriod.getValue());
}

function onRxWindowSizeChange(windowSize) {
    waveAnalyser.setWindowSize(windowSize);
    rxFrequencyCyclePerWindow.setValue(
        frequencyCalculator.getCyclePerWindowFromHertz(
            rxFrequencyHertz.getValue()
        )
    );
}

function onRxWindowFunctionChange() {
    waveAnalyser.setWindowFunction(
        domRxWindowFunctionCheckbox.checked
    );
}

// ------------------------

function getWidthFromDecibel(decibel) {
    var width;

    width = 100 + decibel;
    width = width < 0 ? 0 : width;
    width = width > 100 ? 100 : width;

    return width;
}

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
