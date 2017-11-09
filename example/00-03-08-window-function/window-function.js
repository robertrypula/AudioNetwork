// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 2048,
    SAMPLE_PER_PERIOD = 8,
    AMPLITUDE = 0.5,
    LIMIT_CANVAS_WIDTH = false,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY_DOMAIN = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 301,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -160,
    FREQUENCY_BIN_INTERPOLATION_FACTOR = 64,
    FREQUENCY_BIN_SIZE_TO_INTERPOLATE = 15,
    audioMonoIO,
    ctxTimeDomain,
    ctxFrequencyDomain,
    ctxFrequencyDomainInterpolatedZoom;

function init() {
    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxFrequencyDomain = getConfiguredCanvasContext(
        'canvas-frequency-domain',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxFrequencyDomainInterpolatedZoom = getConfiguredCanvasContext(
        'canvas-frequency-domain-interpolated-zoom',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
}

function run() {
    var
        binOffset = getFormFieldValue('#bin-offset', 'float'),
        cyclePerWindowWithOffset = (FFT_SIZE / SAMPLE_PER_PERIOD) + binOffset,
        samplePerPeriodWithOffset = FFT_SIZE / cyclePerWindowWithOffset,
        waveGenerator = new WaveGenerator(samplePerPeriodWithOffset),
        timeDomainData = [],
        frequencyData,
        frequencyDataInterpolatedZoom,
        start,
        end,
        time,
        i;

    waveGenerator.setAmplitude(AMPLITUDE);
    for (i = 0; i < FFT_SIZE; i++) {
        timeDomainData.push(waveGenerator.getSample());
        waveGenerator.nextSample();
    }

    start = new Date().getTime();
    frequencyData = getFrequencyData(timeDomainData);
    end = new Date().getTime();
    time = end - start;
    alert('Execution time (standard DFT): ' + time + ' ms');

    start = new Date().getTime();
    frequencyDataInterpolatedZoom = getFrequencyDataInterpolatedZoom(timeDomainData);
    end = new Date().getTime();
    time = end - start;
    alert('Execution time (interpolated zoom): ' + time + ' ms');

    drawTimeDomainData(ctxTimeDomain, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyDomain, frequencyData);

    // interpolated zoom
    clear(ctxFrequencyDomainInterpolatedZoom);
    changeColor(ctxFrequencyDomainInterpolatedZoom, 'lightgray');
    for (i = 1; i <= FREQUENCY_BIN_SIZE_TO_INTERPOLATE; i++) {
        drawLine(ctxFrequencyDomainInterpolatedZoom, i * FREQUENCY_BIN_INTERPOLATION_FACTOR, 0, i * FREQUENCY_BIN_INTERPOLATION_FACTOR, CANVAS_HEIGHT);
    }
    changeColor(ctxFrequencyDomainInterpolatedZoom, 'black');
    drawFrequencyDomainData(ctxFrequencyDomainInterpolatedZoom, frequencyDataInterpolatedZoom, true);
}

function getFrequencyData(timeDomainData) {
    var
        dummySamplePerPeriod = 1,   // just for initialization
        windowSize = timeDomainData.length,
        frequencyBinCount = 0.5 * windowSize,
        windowFunction = getCheckboxState('#window-function'),
        waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction),
        N = timeDomainData.length,
        frequencyData = [],
        samplePerPeriod,
        decibel,
        i,
        k;

    for (i = 0; i < timeDomainData.length; i++) {
        waveAnalyser.handle(timeDomainData[i]);
    }

    for (k = 0; k < frequencyBinCount; k++) {
        samplePerPeriod = (k === 0)
            ? Infinity       // DC-offset (0 Hz)
            : N / k;
        waveAnalyser.setSamplePerPeriod(samplePerPeriod);
        decibel = waveAnalyser.getDecibel();
        frequencyData.push(decibel);
    }

    return frequencyData;
}

function getFrequencyDataInterpolatedZoom(timeDomainData) {
    var
        dummySamplePerPeriod = 1,   // just for initialization
        windowSize = timeDomainData.length,
        windowFunction = getCheckboxState('#window-function'),
        waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction),
        N = timeDomainData.length,
        frequencyData = [],
        samplePerPeriod,
        decibel,
        i,
        k,
        kInterpolated,
        kStart,
        kEnd;

    for (i = 0; i < timeDomainData.length; i++) {
        waveAnalyser.handle(timeDomainData[i]);
    }

    kStart = Math.floor(FFT_SIZE / SAMPLE_PER_PERIOD);
    kEnd = kStart + FREQUENCY_BIN_SIZE_TO_INTERPOLATE;
    for (k = kStart; k < kEnd; k++) {
        for (i = 0; i < FREQUENCY_BIN_INTERPOLATION_FACTOR; i++) {
            kInterpolated = k + (i / FREQUENCY_BIN_INTERPOLATION_FACTOR);
            samplePerPeriod = (kInterpolated === 0)
                ? Infinity       // DC-offset (0 Hz)
                : N / kInterpolated;
            waveAnalyser.setSamplePerPeriod(samplePerPeriod);
            decibel = waveAnalyser.getDecibel();
            frequencyData.push(decibel);
        }
    }

    return frequencyData;
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

function changeColor(ctx, color) {
    ctx.strokeStyle = color;
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

function drawTimeDomainData(ctx, data, doNotClear) {
    var limit, hMid, x, y1, y2;

    if (!doNotClear) {
        clear(ctx);
    }

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx, data, doNotClear) {
    var limit, hMaxPix, x, y1, y2;

    if (!doNotClear) {
        clear(ctx);
    }

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
