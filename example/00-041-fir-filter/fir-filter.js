// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    Queue = AudioNetwork.Injector.resolve('Common.Queue'),   // TODO remove this dependency
    audioMonoIO,
    LIMIT_CANVAS_WIDTH = false,   // TODO probably I can remove it completely
    FFT_SIZE = 2 * 1024,         // powers of 2 in range: 32, 32768
    BUFFER_SIZE = 8 * 1024,
    CANVAS_WIDTH_FREQUENCY = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -200,
    TABS_MAX = 2000,
    animationFrameFirstCall = true,
    ctxFrequencyData,
    ctxFilterImpulseResponse,
    domLoopbackCheckbox,
    domWindowFunctionCheckbox,
    domCutoffFrequency,
    domTransitionBandwidth,
    domFilterTapsNumber,
    domFilterImpulseResponseContainer,
    filterCoefficient = [],
    sampleHistoryBuffer;

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

    cutoffFrequency = cutoffFrequency < 1
        ? 1
        : cutoffFrequency;
    cutoffFrequency = cutoffFrequency >= maxCutoffFrequency
        ? maxCutoffFrequency - 1
        : cutoffFrequency;
    maximumTransitionBandwidth = 2 * Math.min(
        maxCutoffFrequency - cutoffFrequency,
        cutoffFrequency
    );
    transitionBandwidth = transitionBandwidth > maximumTransitionBandwidth
        ? maximumTransitionBandwidth
        : transitionBandwidth;

    domCutoffFrequency.value = cutoffFrequency;
    domTransitionBandwidth.value = transitionBandwidth;

    refreshFirFilter();

    domFilterTapsNumber.innerHTML = filterCoefficient.length;

    domFilterImpulseResponseContainer.innerHTML = '<canvas id="canvas-filter-impulse-response"></canvas>';
    ctxFilterImpulseResponse = getConfiguredCanvasContext(
        'canvas-filter-impulse-response',
        filterCoefficient.length,
        CANVAS_HEIGHT
    );
    drawFilterImpulseResponse(ctxFilterImpulseResponse, filterCoefficient);
}

// -----------------------------------------------------------------------
// Finite Impulse Response filter

function refreshFirFilter() {
    var n, N, sum, middleIndex, cutoffFrequencyNormalized;

    N = numberOfTaps();
    if (N > TABS_MAX) {
        alert('Number of required tabs is too high! Value ' + N + ' was limited to ' + TABS_MAX);
        N = TABS_MAX;
    }

    sampleHistoryBuffer = new Queue(N);

    // windowed-sinc lowpass filter
    cutoffFrequencyNormalized = parseInt(domCutoffFrequency.value) / audioMonoIO.getSampleRate();
    middleIndex = (N - 1) / 2;
    sum = 0;
    filterCoefficient.length = 0;
    for (n = 0; n < N; n++) {
        filterCoefficient[n] = sinc(2 * cutoffFrequencyNormalized * (n - middleIndex));
        if (domWindowFunctionCheckbox.checked) {
            filterCoefficient[n] *= blackmanNuttall(n, N);
        }
        sum += filterCoefficient[n];
    }
    for (n = 0; n < N; n++) {
        filterCoefficient[n] /= sum;
    }
}

function numberOfTaps() {
    // http://dsp.stackexchange.com/questions/31066/how-many-taps-does-an-fir-filter-need
    var
        pb = Math.pow(10, -4),  // pass band: 0.1% of amplitude variations gives -40dB
        sb = Math.pow(10, -6),  // stop band: 60 dB should be fine
        logValue,
        transitionBandNormalized,
        numberOfTabs;

    transitionBandNormalized = parseInt(domTransitionBandwidth.value) / audioMonoIO.getSampleRate();

    logValue = Math.log(1 / (10 * pb * sb)) / Math.LN10;
    numberOfTabs = (2 / 3) * logValue * (1 / transitionBandNormalized);
    numberOfTabs = Math.round(numberOfTabs);
    numberOfTabs = numberOfTabs % 2 ? numberOfTabs : numberOfTabs + 1;  // keep this number always odd for symmetry

    return numberOfTabs;
}

function sinc(x) {
    return x !== 0
        ? Math.sin(Math.PI * x) / (Math.PI * x)
        : 1;
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
        monoOut[i] = applyFirFilter(sampleToFilter);
    }
}

function applyFirFilter(sampleToFilter) {
    var N, i, sampleFiltered;

    if (!sampleHistoryBuffer) {
        return sampleToFilter;
    }

    N = filterCoefficient.length;
    sampleFiltered = 0;
    sampleHistoryBuffer.pushEvenIfFull(sampleToFilter);
    if (sampleHistoryBuffer.getSize() === N) {   // let's wait for buffer to fill completely...
        // convolve
        for (i = 0; i < N; i++) {
            sampleFiltered += sampleHistoryBuffer.getItem(i) * filterCoefficient[i];
        }
    }

    return sampleFiltered;
}

function refreshDataOnScreen() {
    var frequencyData = audioMonoIO.getFrequencyData();

    drawFrequencyDomainData(ctxFrequencyData, frequencyData);
}
