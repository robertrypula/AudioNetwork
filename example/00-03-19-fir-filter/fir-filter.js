// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    AudioMonoIO = AudioNetwork.Rewrite.WebAudio.AudioMonoIO,
    Queue = AudioNetwork.Injector.resolve('Common.Queue');   // TODO use buffer Buffer

var
    audioMonoIO,
    LIMIT_CANVAS_WIDTH = false,   // TODO probably I can remove it completely
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 8 * 1024,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -400,
    animationFrameFirstCall = true,
    ctxFrequencyData,
    ctxFilterImpulseResponse,
    domLoopbackCheckbox,
    domWindowFunctionCheckbox,
    domCutoffFrequency,
    domTransitionBandwidth,
    domFilterTapsNumber,
    domFilterImpulseResponseContainer,
    firFilterCoefficient,
    firFilterSampleHistoryBuffer;

function init() {
    initDomElement();
    initWebAudioApi();
    onFilterParametersChange();

    animationFrameLoop();   // run animation loop
}

function initDomElement() {
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domWindowFunctionCheckbox = document.getElementById('window-function-checkbox');
    domCutoffFrequency = document.getElementById('cutoff-frequency');
    domTransitionBandwidth = document.getElementById('transition-bandwidth');
    domFilterTapsNumber = document.getElementById('filter-taps-number');
    domFilterImpulseResponseContainer = document.getElementById('filter-impulse-response-container');

    ctxFrequencyData = getConfiguredCanvasContext(
        'canvas-frequency-data',
        CANVAS_WIDTH_FREQUENCY,
        CANVAS_HEIGHT
    );
}

function initWebAudioApi() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE, BUFFER_SIZE);

    audioMonoIO.setVolume(1);
    audioMonoIO.setSampleOutHandler(sampleOutHandler);

    audioMonoIO.setSmoothingTimeConstant(0.9);
    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

function onFilterParametersChange() {
    var
        maxCutoffFrequency = audioMonoIO.getSampleRate() / 2,
        maximumTransitionBandwidth,
        cutoffFrequency = parseInt(domCutoffFrequency.value),
        transitionBandwidth = parseInt(domTransitionBandwidth.value);

    cutoffFrequency = cutoffFrequency < 0
        ? 0
        : cutoffFrequency;
    cutoffFrequency = cutoffFrequency >= maxCutoffFrequency
        ? maxCutoffFrequency - 1
        : cutoffFrequency;

    // TODO verify transition bandwidth, something might be wrong here
    maximumTransitionBandwidth = maxCutoffFrequency - cutoffFrequency;
    transitionBandwidth = transitionBandwidth > maximumTransitionBandwidth
        ? maximumTransitionBandwidth
        : transitionBandwidth;

    domCutoffFrequency.value = cutoffFrequency;
    domTransitionBandwidth.value = transitionBandwidth;

    updateFirFilter();

    domFilterTapsNumber.innerHTML = firFilterCoefficient.length;

    domFilterImpulseResponseContainer.innerHTML = '<canvas id="canvas-filter-impulse-response"></canvas>';
    ctxFilterImpulseResponse = getConfiguredCanvasContext(
        'canvas-filter-impulse-response',
        firFilterCoefficient.length,
        CANVAS_HEIGHT
    );
    drawFilterImpulseResponse(ctxFilterImpulseResponse, firFilterCoefficient);
}

function updateFirFilter() {
    var
        cutoffNormalized,
        transitionBandNormalized,
        numberOfTaps;

    cutoffNormalized = parseFloat(domCutoffFrequency.value) / audioMonoIO.getSampleRate();
    transitionBandNormalized = parseFloat(domTransitionBandwidth.value) / audioMonoIO.getSampleRate();
    numberOfTaps = getNumberOfTaps(transitionBandNormalized);

    firFilterCoefficient = getFirFilterCoefficientLowPassSinc(
        cutoffNormalized,
        numberOfTaps
    );
    firFilterCoefficient = applyWindowFunctionAndNormalize(firFilterCoefficient);
    firFilterSampleHistoryBuffer = new Queue(firFilterCoefficient.length);
}

// -----------------------------------------------------------------------
// Finite Impulse Response filter

function getFirFilterCoefficientLowPassSinc(cutoffNormalized, numberOfTaps) {
    var n, middleIndex, output;

    middleIndex = (numberOfTaps - 1) / 2;
    output = [];
    for (n = 0; n < numberOfTaps; n++) {
        output[n] = sinc(2 * cutoffNormalized * (n - middleIndex));
    }

    return output;
}

function sinc(x) {
    return x !== 0
        ? Math.sin(Math.PI * x) / (Math.PI * x)
        : 1;
}

function applyWindowFunctionAndNormalize(input) {
    var i, windowValue, length, output, newValue, sum;

    output = [];
    length = input.length;
    sum = 0;
    for (i = 0; i < length; i++) {
        windowValue = blackmanNuttall(i, length);
        newValue = input[i] * windowValue;
        sum += newValue;
        output.push(newValue);
    }
    for (i = 0; i < length; i++) {
        output[i] /= sum;
    }

    return output;
}

function getNumberOfTaps(transitionBandNormalized) {
    // http://dsp.stackexchange.com/questions/31066/how-many-taps-does-an-fir-filter-need
    var
        pb = Math.pow(10, -4),  // pass band: 0.1% of amplitude variations gives -40dB
        sb = Math.pow(10, -6),  // stop band: 60 dB should be fine
        logValue,
        numberOfTabs;

    logValue = Math.log(1 / (10 * pb * sb)) / Math.LN10;
    numberOfTabs = (2 / 3) * logValue * (1 / transitionBandNormalized);
    numberOfTabs = Math.round(numberOfTabs);
    numberOfTabs = numberOfTabs % 2 ? numberOfTabs : numberOfTabs + 1;  // keep this number always odd for symmetry

    return numberOfTabs;
}

function getFilteredSample(sampleHistoryBuffer, coefficient) {
    var i, sampleFiltered, length;

    length = coefficient.length;
    sampleFiltered = 0;
    if (sampleHistoryBuffer.getSize() === length) {   // let's wait for buffer to fill completely...
        // ...and do convolution step
        for (i = 0; i < length; i++) {
            sampleFiltered += sampleHistoryBuffer.getItem(i) * coefficient[i];
        }
    }

    return sampleFiltered;
}

function blackmanNuttall(n, N) {
    return 0.3635819
        - 0.4891775 * Math.cos(2 * Math.PI * n / (N - 1))
        + 0.1365995 * Math.cos(4 * Math.PI * n / (N - 1))
        - 0.0106411 * Math.cos(6 * Math.PI * n / (N - 1));
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

function drawFrequencyDomainData(ctx, data) {
    var limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x  + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFilterImpulseResponse(ctx, data) {
    var limit, hMid, x, y1, y2, absValue, maxAbsValue, scale;

    clear(ctx);

    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit; x++) {
        absValue = Math.abs(data[x]);
        if (x === 0 || absValue > maxAbsValue) {
            maxAbsValue = absValue
        }
    }
    scale = 1 / maxAbsValue;

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x] * scale);
        y2 = hMid * (1 - data[x + 1] * scale);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

// -----------------------------------------------------------------------
// data handlers

function sampleOutHandler(monoOut, monoIn) {
    var
        i,
        whiteNoiseSample,
        microphoneSample,
        sampleToFilter,
        isLoopbackEnabled;

    isLoopbackEnabled = domLoopbackCheckbox.checked;

    for (i = 0; i < monoOut.length; i++) {
        whiteNoiseSample = (-1 + Math.random() * 2) * 0.05;
        microphoneSample = monoIn[i];

        sampleToFilter = isLoopbackEnabled ? whiteNoiseSample : microphoneSample;

        monoOut[i] = applyFilter(sampleToFilter);
    }
}

function applyFilter(sampleToFilter) {
    var filteredSample;

    firFilterSampleHistoryBuffer.pushEvenIfFull(sampleToFilter);
    filteredSample = getFilteredSample(firFilterSampleHistoryBuffer, firFilterCoefficient);

    return filteredSample;
}

function refreshDataOnScreen() {
    var frequencyData = audioMonoIO.getFrequencyData();

    drawFrequencyDomainData(ctxFrequencyData, frequencyData);
}
