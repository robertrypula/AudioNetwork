// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    AudioMonoIO = AudioNetwork.Rewrite.WebAudio.AudioMonoIO,
    WaveAnalyser = AudioNetwork.Rewrite.Dsp.WaveAnalyser;

var
    FFT_SIZE = 2048,
    LIMIT_CANVAS_WIDTH = false,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY_DOMAIN = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 1024 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -150,
    audioMonoIO,
    ctxTimeDomain,
    ctxAnalyserNode,
    ctxWaveAnalyser;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);

    ctxTimeDomain = getConfiguredCanvasContext(
        'canvas-time-domain',
        CANVAS_WIDTH_TIME_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxAnalyserNode = getConfiguredCanvasContext(
        'canvas-analyser-node',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
    ctxWaveAnalyser = getConfiguredCanvasContext(
        'canvas-wave-analyser',
        CANVAS_WIDTH_FREQUENCY_DOMAIN,
        CANVAS_HEIGHT
    );
}

function compareWithAnalyserNode() {
    var
        timeDomainData = audioMonoIO.getTimeDomainData(),
        frequencyDataAnalyserNode = audioMonoIO.getFrequencyData(),
        frequencyDataWaveAnalyser,
        start,
        end,
        time;

    start = new Date().getTime();
    frequencyDataWaveAnalyser = getFrequencyData(timeDomainData);
    end = new Date().getTime();
    time = end - start;
    alert('Execution time: ' + time + ' ms');

    drawTimeDomainData(ctxTimeDomain, timeDomainData);
    drawFrequencyDomainData(ctxAnalyserNode, frequencyDataAnalyserNode);
    drawFrequencyDomainData(ctxWaveAnalyser, frequencyDataWaveAnalyser);
}

function getFrequencyData(timeDomainData) {
    var
        dummySamplePerPeriod = 1,   // just for initialization
        windowSize = timeDomainData.length,
        frequencyBinCount = 0.5 * windowSize,
        windowFunction = true,
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

function drawTimeDomainData(ctx, data) {
    var limit, hMid, x, y1, y2;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}

function drawFrequencyDomainData(ctx, data) {
    var limit, hMaxPix, x, y1, y2;

    clear(ctx);

    hMaxPix = CANVAS_HEIGHT - 1;
    limit = Math.min(MAX_WIDTH, data.length);
    for (x = 0; x < limit - 1; x++) {
        y1 = hMaxPix * (data[x] / DECIBEL_MIN);
        y2 = hMaxPix * (data[x + 1] / DECIBEL_MIN);
        drawLine(ctx, x, y1, x + 1, y2);
    }
}
