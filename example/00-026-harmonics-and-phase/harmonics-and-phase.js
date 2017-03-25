// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    LIMIT_CANVAS_WIDTH = true,
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 1 * 1024,
    CANVAS_WIDTH_TIME_DOMAIN = BUFFER_SIZE,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    NORMAL_VALUE = false,
    INITIAL_FREQUENCY = 500,
    INITIAL_VOLUME = 0.25,
    INITIAL_PHASE = 0,
    SYNC_FREQUENCY_DIGIT_BEFORE_THE_DOT = 5,
    SYNC_FREQUENCY_DIGIT_AFTER_THE_DOT = 3,
    FUNDAMENTAL_FREQUENCY_DIGIT_BEFORE_THE_DOT = 5,
    FUNDAMENTAL_FREQUENCY_DIGIT_AFTER_THE_DOT = 6,
    HARMONIC_AMPLITUDE_DIGIT_BEFORE_THE_DOT = 1,
    HARMONIC_AMPLITUDE_DIGIT_AFTER_THE_DOT = 6,
    HARMONIC_LOCAL_PHASE_DIGIT_BEFORE_THE_DOT = 1,
    HARMONIC_LOCAL_PHASE_DIGIT_AFTER_THE_DOT = 3,
    animationFrameFirstCall = true,
    domLoudestFrequency,
    domSyncCheckbox,
    domLoopbackCheckbox,
    domHarmonicNumberInput,
    domSyncFrequencWidget,
    domFundamentalFrequencyWidget,
    domHarmonicListingWidget,
    domHarmonicAmplitudeWidget,
    domHarmonicLocalPhaseWidget,
    ctxFrequencyData,
    ctxTimeDomain,
    audioMonoIO,
    txFrequency = INITIAL_FREQUENCY,
    txVolume = INITIAL_VOLUME,
    txPhase = INITIAL_PHASE,
    txHarmonicAmplitude = [],
    txHarmonicPhase = [],
    txHarmonicNumber = 16,
    currentHarmonicIndex = 0,
    sampleGlobalCounter = 0,
    syncFrequency = INITIAL_FREQUENCY,
    fundamentalFrequency = INITIAL_FREQUENCY;    // this is acctually txFrequency TODO use only txFrequency variable

function init() {
    initDomElements();
    initWebAudioApi();

    overwriteInitialFrequency();    // experimental

    loadPredefinedWaveType('square');
    updateHarmonicArrayLength();
    updateSyncFrequencyOnScreen();
    updateFundamentalFrequencyOnScreen();
    refreshHarmonicDataOnScreen();

    animationFrameLoop();   // run animation loop
}

function initDomElements() {
    domLoudestFrequency = document.getElementById('loudest-frequency');
    domSyncCheckbox = document.getElementById('sync-checkbox');
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domHarmonicNumberInput = document.getElementById('harmonic-number');
    domSyncFrequencWidget = document.getElementById('sync-frequency-editable-float-widget');
    domFundamentalFrequencyWidget = document.getElementById('fundamental-frequency-editable-float-widget');
    domHarmonicListingWidget = document.getElementById('harmonic-listing-widget');
    domHarmonicAmplitudeWidget = document.getElementById('harmonic-amplitude-editable-float-widget');
    domHarmonicLocalPhaseWidget = document.getElementById('harmonic-local-phase-editable-float-widget');

    ctxFrequencyData = getConfiguredCanvasContext(
        'canvas-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
        CANVAS_HEIGHT
    );
    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );

    domHarmonicNumberInput.value = txHarmonicNumber;
}

function initWebAudioApi() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);
    audioMonoIO.setSampleInHandler(function (monoDataIn) {
        scriptProcessorNodeHandler(monoDataIn);
    });
    onLoopbackCheckboxChange();
}

function overwriteInitialFrequency() {
    var
        fftResolution = audioMonoIO.getFFTResolution(),
        halfkHzBinIndex = Math.ceil(500 / fftResolution),
        newInitialFrequency = halfkHzBinIndex * fftResolution;

    txFrequency = newInitialFrequency;
    syncFrequency = newInitialFrequency;
    fundamentalFrequency = newInitialFrequency;
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

function onHarmonicNumberInputChange() {
    txHarmonicNumber = parseInt(domHarmonicNumberInput.value);
    txHarmonicNumber = txHarmonicNumber >= 1 ? txHarmonicNumber : 1;
    currentHarmonicIndex = currentHarmonicIndex >= txHarmonicNumber ? txHarmonicNumber - 1 : currentHarmonicIndex;
    domHarmonicNumberInput.value = txHarmonicNumber;
    updateHarmonicArrayLength();
    refreshHarmonicDataOnScreen();
}

function harmonicUpWidgetClick() {
    currentHarmonicIndex--;
    currentHarmonicIndex = currentHarmonicIndex < 0 ? txHarmonicNumber - 1 : currentHarmonicIndex;
    refreshHarmonicDataOnScreen();
}

function harmonicDownWidgetClick() {
    currentHarmonicIndex++;
    currentHarmonicIndex = currentHarmonicIndex >= txHarmonicNumber ? 0 : currentHarmonicIndex;
    refreshHarmonicDataOnScreen();
}

// -----------------------------------------------------------------------
// float edit widget stuff

function harmonicAmplitudeWidgetClick(action, digitPosition) {
    txHarmonicAmplitude[currentHarmonicIndex] = changeDigitInFloat(
        action,
        digitPosition,
        txHarmonicAmplitude[currentHarmonicIndex],
        HARMONIC_AMPLITUDE_DIGIT_BEFORE_THE_DOT,
        HARMONIC_AMPLITUDE_DIGIT_AFTER_THE_DOT
    );
    updateHarmonicAmplitudeOnScreen();
    updateOutputWave();
}

function updateHarmonicAmplitudeOnScreen() {
    updateDigitInWidget(
        domHarmonicAmplitudeWidget,
        txHarmonicAmplitude[currentHarmonicIndex],
        HARMONIC_AMPLITUDE_DIGIT_BEFORE_THE_DOT,
        HARMONIC_AMPLITUDE_DIGIT_AFTER_THE_DOT
    );
}

// ------

function harmonicLocalPhaseWidgetClick(action, digitPosition) {
    txHarmonicPhase[currentHarmonicIndex] = changeDigitInFloat(
        action,
        digitPosition,
        txHarmonicPhase[currentHarmonicIndex],
        HARMONIC_LOCAL_PHASE_DIGIT_BEFORE_THE_DOT,
        HARMONIC_LOCAL_PHASE_DIGIT_AFTER_THE_DOT
    );
    updateHarmonicLocalPhaseOnScreen();
    updateOutputWave();
}

function updateHarmonicLocalPhaseOnScreen() {
    updateDigitInWidget(
        domHarmonicLocalPhaseWidget,
        txHarmonicPhase[currentHarmonicIndex],
        HARMONIC_LOCAL_PHASE_DIGIT_BEFORE_THE_DOT,
        HARMONIC_LOCAL_PHASE_DIGIT_AFTER_THE_DOT
    );
}

// ------

function fundamentalFrequencyWidgetClick(action, digitPosition) {
    fundamentalFrequency = changeDigitInFloat(
        action,
        digitPosition,
        fundamentalFrequency,
        FUNDAMENTAL_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        FUNDAMENTAL_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
    updateFundamentalFrequencyOnScreen();
    frequencyChange(fundamentalFrequency);
}

function updateFundamentalFrequencyOnScreen() {
    updateDigitInWidget(
        domFundamentalFrequencyWidget,
        fundamentalFrequency,
        FUNDAMENTAL_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        FUNDAMENTAL_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
}

// ------

function syncFrequencyWidgetClick(action, digitPosition) {
    syncFrequency = changeDigitInFloat(
        action,
        digitPosition,
        syncFrequency,
        SYNC_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        SYNC_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
    updateSyncFrequencyOnScreen();
}

function updateSyncFrequencyOnScreen() {
    updateDigitInWidget(
        domSyncFrequencWidget,
        syncFrequency,
        SYNC_FREQUENCY_DIGIT_BEFORE_THE_DOT,
        SYNC_FREQUENCY_DIGIT_AFTER_THE_DOT
    );
}

// ------

function updateDigitInWidget(domElement, value, digitBeforeTheDot, digitAfterTheDot) {
    var element, digitSelector, digitValue, selector, i;

    for (i = digitBeforeTheDot - 1; i >= -digitAfterTheDot; i--) {
        digitValue = getDecimalDigit(value, i, digitAfterTheDot);
        digitSelector = '.digit_' + i;
        selector = '#' + domElement.id + ' span' + digitSelector;
        element = document.querySelector(selector);
        element.innerHTML = digitValue;
    }
}
    
// -----------------------------------------------------------------------
// output wave stuff

function loadPredefinedWaveType(type) {
    switch (type) {
        case 'square':
            loadSquareWave();
            break;
        case 'sawtooth':
            loadSawtoothWave();
            break;
        case 'triangle':
            loadTriangleWave();
            break;
        case 'piano':
            loadPianoWave();
            break;
        case 'violin':
            loadViolinWave();
            break;
        default:       // use just 'sine' for all not defined types
            loadSineWave();
    }
    updateOutputWave();
    refreshHarmonicDataOnScreen();
}

function updateHarmonicArrayLength() {
    var i;

    if (txHarmonicAmplitude) {
        txHarmonicAmplitude.length = txHarmonicNumber;
        for (i = 0; i < txHarmonicAmplitude.length; i++) {
            if (typeof txHarmonicAmplitude[i] === 'undefined') {
                txHarmonicAmplitude[i] = 0;
            }
        }
    }
    if (txHarmonicPhase) {
        txHarmonicPhase.length = txHarmonicNumber;
        for (i = 0; i < txHarmonicPhase.length; i++) {
            if (typeof txHarmonicPhase[i] === 'undefined') {
                txHarmonicPhase[i] = 0;
            }
        }
    }
}

function loadSineWave() {
    var i, harmonicNumber;

    for (i = 0; i < txHarmonicNumber; i++) {
        harmonicNumber = i + 1;
        txHarmonicAmplitude[i] = (harmonicNumber === 1) ? 1 : 0;
        txHarmonicPhase[i] = 0;
    }
}

function loadSquareWave() {
    var i, harmonicNumber, isOddHarmonic;

    for (i = 0; i < txHarmonicNumber; i++) {
        harmonicNumber = i + 1;
        isOddHarmonic = (harmonicNumber % 2 === 1);
        txHarmonicAmplitude[i] = isOddHarmonic ? (1 / harmonicNumber) : 0;
        txHarmonicPhase[i] = 0;
    }
}

function loadSawtoothWave() {
    var i, baseAmplitude, harmonicNumber, isOddHarmonic, sign;

    baseAmplitude = 2 * 0.8 / Math.PI;
    for (i = 0; i < txHarmonicNumber; i++) {
        harmonicNumber = i + 1;
        isOddHarmonic = (harmonicNumber % 2 === 1);
        sign = isOddHarmonic ? -1 : +1;
        txHarmonicAmplitude[i] = sign * baseAmplitude / harmonicNumber;
        txHarmonicPhase[i] = 0;
    }
}

function loadTriangleWave() {
    var i, iDoubled, iHalf, baseAmplitude, harmonicNumber, isOddHarmonic, sign;

    baseAmplitude = 8.0 / (Math.PI * Math.PI);
    for (i = 0; i < txHarmonicNumber; i++) {
        iDoubled = i * 2;
        iHalf = i / 2;
        harmonicNumber = i + 1;
        isOddHarmonic = (harmonicNumber % 2 === 1);
        sign = (iHalf % 2) === 1 ? +1 : -1;
        txHarmonicAmplitude[i] = isOddHarmonic
            ? (sign * baseAmplitude /  Math.pow(2 * iHalf + 1, 2))
            : 0;
        txHarmonicPhase[i] = 0;
    }
}

function loadPianoWave() {
    // harmonics from:
    // http://stackoverflow.com/questions/10702942/note-synthesis-harmonics-violin-piano-guitar-bass-frequencies-midi/11615460
    var
        piano = [
            1.0,                                   // 1
            0.399064778, 0.229404484, 0.151836061, // 2, 3, 4
            0.196754229, 0.093742264, 0.060871957, // 5, 6, 7
            0.138605419, 0.010535002, 0.071021868, // 8, 9, 10
            0.029954614, 0.051299684, 0.055948288, // 11, 12, 13
            0.066208224, 0.010067391, 0.007536790, // 14, 15, 16
            0.008196947, 0.012955577, 0.007316738, // 17, 18, 19
            0.006216476, 0.005116215, 0.006243983, // 20, 21, 22
            0.002860679, 0.002558108, 0.000000000, // 23, 24, 25
            0.001650392                            // 26
        ],
        i,
        indexLimit;

    indexLimit = Math.min(txHarmonicNumber, piano.length);
    for (i = 0; i < indexLimit; i++) {
        txHarmonicAmplitude[i] = piano[i];
        txHarmonicPhase[i] = 0;
    }
}

function loadViolinWave() {
    // harmonics from:
    // http://stackoverflow.com/questions/10702942/note-synthesis-harmonics-violin-piano-guitar-bass-frequencies-midi/11615460
    var
        violin = [
            1.0,                                   // 1
            0.286699025, 0.150079537, 0.042909002, // 2, 3, 4
            0.203797365, 0.229228698, 0.156931925, // 5, 6, 7
            0.115470898, 0.000000000, 0.097401803, // 8, 9, 10
            0.087653465, 0.052331036, 0.052922462, // 11, 12, 13
            0.038850593, 0.053554676, 0.053697434, // 14, 15, 16
            0.022270261, 0.013072562, 0.008585879, // 17, 18, 19
            0.005771505, 0.004343925, 0.002141371, // 20, 21, 22
            0.005343231, 0.000530244, 0.004711017, // 23, 24, 25
            0.009014153                            // 26
        ],
        i,
        indexLimit;

    indexLimit = Math.min(txHarmonicNumber, violin.length);
    for (i = 0; i < indexLimit; i++) {
        txHarmonicAmplitude[i] = violin[i];
        txHarmonicPhase[i] = 0;
    }
}

function updateOutputWave() {
    audioMonoIO.setPeriodicWave(
        txFrequency,
        txVolume,
        txPhase,
        txHarmonicAmplitude,
        txHarmonicPhase
    );
}

function volumeChange(volume) {
    txVolume = volume;
    updateOutputWave();
}

function phaseChange(phase) {
    txPhase = phase;
    updateOutputWave();
}

function frequencyChange(frequency) {
    txFrequency = frequency;
    updateOutputWave();
}

// -----------------------------------------------------------------------
// harmonic editor stuff

function refreshHarmonicDataOnScreen() {
    updateHarmonicAmplitudeOnScreen();
    updateHarmonicLocalPhaseOnScreen();
    updateHarmonicListingOnScreen();
}

function updateHarmonicListingOnScreen() {
    var i, html;

    html = '';
    for (i = 0; i < txHarmonicNumber; i++) {
        html += '[' + (i + 1) + '] ';
        html += ' a=' + txHarmonicAmplitude[i].toFixed(HARMONIC_AMPLITUDE_DIGIT_AFTER_THE_DOT);
        html += ' p=' + txHarmonicPhase[i].toFixed(HARMONIC_LOCAL_PHASE_DIGIT_AFTER_THE_DOT);
        if (i === currentHarmonicIndex) {
            html += ' <---';
        }
        html += '<br/>';
    }
    domHarmonicListingWidget.innerHTML = html;
}

// -----------------------------------------------------------------------
// utils

function getDecimalDigit(value, digitPosition, digitAfterTheDot) {
    var
        valueStr = value.toFixed(digitAfterTheDot),
        dotIndex = valueStr.indexOf('.'),
        zeroPositionIndex,
        index,
        result = 0;

    if (dotIndex === -1) {
        zeroPositionIndex = valueStr.length - 1;
    } else {
        zeroPositionIndex = dotIndex - 1;
        valueStr = valueStr.replace('.', '');
    }

    index = zeroPositionIndex - digitPosition;
    if (index >= 0 && index < valueStr.length) {
        result = valueStr[index];
    }

    return result;
}

function changeDigitInFloat(action, digitPosition, value, digitBeforeTheDot, digitAfterTheDot) {
    var
        maxValue = Math.pow(10, digitBeforeTheDot) - 1,
        minValue = 0; // TODO check it: Math.pow(10, -digitAfterTheDot);

    switch (action) {
        case '+':
            value += Math.pow(10, digitPosition);
            value = value > maxValue ? maxValue : value;
            break;
        case '-':
            value -= Math.pow(10, digitPosition);
            value = value < minValue ? minValue : value;
            break;
    }

    value = parseFloat(
        value.toFixed(digitAfterTheDot)
    );

    return value;
}

function getIndexOfMax(data, absoluteValue) {
    var i, maxIndex, max, value;

    for (i = 0; i < data.length; i++) {
        value = absoluteValue ? Math.abs(data[i]) : data[i];
        if (i === 0 || value > max) {
            max = value;
            maxIndex = i;
        }
    }

    return maxIndex;
}

function getFrequency(fftBinIndex) {
    var fftResolution = audioMonoIO.getFFTResolution();

    return (fftBinIndex * fftResolution).toFixed(2);
}

function getSamplePerPeriod(frequency) {
    return audioMonoIO.getSampleRate() / frequency;
}

// -----------------------------------------------------------------------
// animation, canvas 2d context

function clear(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function getConfiguredCanvasContext(elementId, width, height) {
    var element, ctx;

    element = document.getElementById(elementId);
    element.width = Math.min(MAX_WIDTH, width);
    element.height = height;
    ctx = element.getContext('2d');
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';

    return ctx;
}

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        refreshDataOnScreen();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

// -----------------------------------------------------------------------
// data handlers

function scriptProcessorNodeHandler(monoIn) {
    drawTimeDomainData(ctxTimeDomain, monoIn);

    sampleGlobalCounter += monoIn.length;
}

function refreshDataOnScreen() {
    var
        frequencyData = audioMonoIO.getFrequencyData(),
        frequencyDataMaxValueIndex = getIndexOfMax(frequencyData, NORMAL_VALUE);

    drawFrequencyDomainData(ctxFrequencyData, frequencyData, frequencyDataMaxValueIndex);

    domLoudestFrequency.innerHTML =
        '[' + frequencyDataMaxValueIndex + '] ' + frequencyData[frequencyDataMaxValueIndex].toFixed(2) + ' dB (' + getFrequency(frequencyDataMaxValueIndex) + ' Hz)';
}

function drawTimeDomainData(ctx, data) {
    var
        limit,
        hMid,
        syncSamplePerPeriod,
        firstZeroCrossingIndex,
        index,
        x,
        y1,
        y2;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);

    if (domSyncCheckbox.checked) {
        syncSamplePerPeriod = getSamplePerPeriod(syncFrequency);
        // console.log(syncSamplePerPeriod, sampleGlobalCounter);
        firstZeroCrossingIndex = Math.round(sampleGlobalCounter % syncSamplePerPeriod);
    } else {
        firstZeroCrossingIndex = 0;
    }

    limit = Math.min(MAX_WIDTH, data.length) - 1 - firstZeroCrossingIndex;
    for (x = 0; x < limit; x++) {
        index = x + firstZeroCrossingIndex;
        y1 = hMid * (1 - data[index]);
        y2 = hMid * (1 - data[index + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx, data, frequencyDataMaxValueIndex) {
    var limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x  + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);

        // mark loudest frequency
        if (x === frequencyDataMaxValueIndex) {
            drawLine(ctx, x, y1, x, hMaxPix);
        }
    }
}
