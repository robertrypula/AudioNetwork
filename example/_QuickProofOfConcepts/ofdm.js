// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// NOTE: Very fast written Proof Of Concept of OFDM communication

var
    AudioMonoIO = AudioNetwork.Rewrite.WebAudio.AudioMonoIO,
    WaveAnalyser = AudioNetwork.Rewrite.Dsp.WaveAnalyser;

var
    BIN_SCALER = 64,
    FFT_SIZE = 8192,
    LIMIT_CANVAS_WIDTH = true,
    CANVAS_WIDTH_TIME_DOMAIN = FFT_SIZE,
    CANVAS_WIDTH_FREQUENCY_DOMAIN = FFT_SIZE * 0.5,
    CANVAS_HEIGHT = 201,
    MAX_WIDTH = LIMIT_CANVAS_WIDTH ? 2048 : Number.POSITIVE_INFINITY,
    DECIBEL_MIN = -160,
    audioMonoIO,
    spectrogram,
    ctxTimeDomain,
    ctxFrequencyDomain;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    spectrogram = new Spectrogram(document.getElementById('spectrogram'));

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

    setInterval(analyse, 500);

    setInterval(function () {
        if (!getCheckboxState('#auto-generate')) {
            return;
        }
        select('#sub-carrier-1')[0].value = (getFormFieldValue('#sub-carrier-1', 'int') + 10) % 360;
        select('#sub-carrier-3')[0].value = (getFormFieldValue('#sub-carrier-3', 'int') + 45) % 360;
        select('#sub-carrier-4')[0].value = (getFormFieldValue('#sub-carrier-4', 'int') + 90) % 360;
        select('#sub-carrier-5')[0].value = (getFormFieldValue('#sub-carrier-5', 'int') + 180) % 360;
        txStartUpdate();
    }, 1000);
}

function loopbackChange() {
    audioMonoIO.setLoopback(getCheckboxState('#loopback'));
}

function getTransmitFrequency() {
    return BIN_SCALER * getFormFieldValue('#tx-sample-rate', 'int') / FFT_SIZE;
}

function setTone() {
    var
        p0 = getFormFieldValue('#sub-carrier-0', 'int') / 360, a0 = p0 < 0 ? 0 : 1,
        p1 = getFormFieldValue('#sub-carrier-1', 'int') / 360, a1 = p1 < 0 ? 0 : 1,
        p2 = getFormFieldValue('#sub-carrier-2', 'int') / 360, a2 = p2 < 0 ? 0 : 1,
        p3 = getFormFieldValue('#sub-carrier-3', 'int') / 360, a3 = p3 < 0 ? 0 : 1,
        p4 = getFormFieldValue('#sub-carrier-4', 'int') / 360, a4 = p4 < 0 ? 0 : 1,
        p5 = getFormFieldValue('#sub-carrier-5', 'int') / 360, a5 = p5 < 0 ? 0 : 1,
        p6 = getFormFieldValue('#sub-carrier-6', 'int') / 360, a6 = p6 < 0 ? 0 : 1,
        p7 = getFormFieldValue('#sub-carrier-7', 'int') / 360, a7 = p7 < 0 ? 0 : 1,
        p8 = getFormFieldValue('#sub-carrier-8', 'int') / 360, a8 = p8 < 0 ? 0 : 1,
        p9 = getFormFieldValue('#sub-carrier-9', 'int') / 360, a9 = p9 < 0 ? 0 : 1;

    audioMonoIO.setPeriodicWave(
        getTransmitFrequency(),
        1,
        0,
        [0, 0, 0, 0, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9],
        [0, 0, 0, 0, p0, p1, p2, p3, p4, p5, p6, p7, p8, p9]
    //   1  2  3  4   5   6   7   8   9  10  11  12  13  14
    );
}

function txStartUpdate() {
    setTone();
}

function txStop() {
    audioMonoIO.setPeriodicWave(0);
}

function analyse() {
    var
        timeDomainDataOriginal,
        timeDomainData = [],
        frequencyData,
        unitPhaseData = [],
        f = getFormFieldValue('#factor', 'int'),
        startingOffset = getFormFieldValue('#time-domain-starting-offset', 'int'),
        fixedUnitPhase,
        start,
        end,
        time,
        log,
        i;

    start = new Date().getTime();

    timeDomainDataOriginal = audioMonoIO.getTimeDomainData();
    for (i = startingOffset; i < startingOffset + timeDomainDataOriginal.length / (BIN_SCALER / f); i++) {
        timeDomainData.push(timeDomainDataOriginal[i]);
    }


    frequencyData = getFrequencyData(
        timeDomainData,
        unitPhaseData,
        [0 * f, 1 * f, 2 * f, 3 * f, 4 * f, 5 * f, 6 * f, 7 * f, 8 * f, 9 * f, 10 * f, 11 * f, 12 * f, 13 * f, 14 * f]
    );

    spectrogram.add(
        frequencyData,
        5,
        14,
        getTransmitFrequency(),
        Spectrogram.INDEX_MARKER_DISABLED,
        Spectrogram.ROW_MARKER_DISABLED
    );

    if (getCheckboxState('#fix-phase')) {
        fixedUnitPhase = getFixedUnitPhaseData(unitPhaseData);
    } else {
        fixedUnitPhase = unitPhaseData;
    }

    log = '';
    for (i = 0; i < frequencyData.length; i++) {
        log += i + '# ' + frequencyData[i].toFixed(1) + ' dB, ' + convertToDegree(unitPhaseData[i]) + ', ' + convertToDegree(fixedUnitPhase[i]) + '<br/>';
    }
    html('#subcarrier-log', log);

    if (getCheckboxState('#log-scale')) {
        for (i = 0; i < timeDomainData.length; i++) {
            timeDomainData[i] = logScale(timeDomainData[i]);
        }
    }

    drawTimeDomainData(ctxTimeDomain, timeDomainData);
    drawFrequencyDomainData(ctxFrequencyDomain, frequencyData);
    drawUnitPhaseData(ctxFrequencyDomain, fixedUnitPhase, frequencyData);

    end = new Date().getTime();
    time = end - start;
    html('#time-log', time + ' ms');
}

function log10(value) {
    return Math.log(value) / Math.log(10);
}

function logScale(value) {
    var minus = value < 0;

    value = value > 1 ? 1 : value;
    value = Math.abs(value);
    value *= 100000;
    if (value <= 1) {
        value = 0;
    } else {
        value = log10(value) / 5;
    }

    return minus ? -value : value;
}

function convertToDegree(value) {
    value = normalizeUnit(value);
    value *= 360;
    value = Math.round(value);
    value = value >= 360 ? value - 360 : value;

    return value;
}

function getFixedUnitPhaseData(unitPhaseData) {
    var phaseGlobal, i, j, result, absDiff, bestAbsDiff, index;

    bestAbsDiff =
        getDistanceToZeroDegree(unitPhaseData[5]) +
        getDistanceToZeroDegree(unitPhaseData[7]) +
        getDistanceToZeroDegree(unitPhaseData[11]);
    result = unitPhaseData.slice(0);
    index = 0;

    // TODO find better solution than this brute force one... ;)
    for (i = 0; i <= 128 * 10; i++) {
        phaseGlobal = i / (128 * 10);
        absDiff =
            getDistanceToZeroDegree(unitPhaseData[5] + 5 * phaseGlobal) +
            getDistanceToZeroDegree(unitPhaseData[7] + 7 * phaseGlobal) +
            getDistanceToZeroDegree(unitPhaseData[11] + 11 * phaseGlobal);

        if (absDiff < bestAbsDiff) {
            index = i;
            bestAbsDiff = absDiff;
            result.length = 0;
            for (j = 0; j < unitPhaseData.length; j++) {
                result.push(normalizeUnit(unitPhaseData[j] + j * phaseGlobal));
            }
        }
    }

    return result;
}

function normalizeUnit(value) {
    value =  value - Math.floor(value);
    value = value >= 1 ? value - 1 : value;

    return value;
}

function getDistanceToZeroDegree(value) {
    value = normalizeUnit(value);

    return Math.abs(value > 0.5 ? -1 + value : value);
}

function getFrequencyData(timeDomainData, unitPhaseData, calculateList) {
    var
        dummySamplePerPeriod = 1,   // just for initialization
        windowSize = timeDomainData.length,
        frequencyBinCount = 0.5 * windowSize,
        windowFunction = false,
        waveAnalyser = new WaveAnalyser(dummySamplePerPeriod, windowSize, windowFunction),
        N = timeDomainData.length,
        frequencyData = [],
        frequencyBin,
        i,
        k;

    for (i = 0; i < timeDomainData.length; i++) {
        waveAnalyser.handle(timeDomainData[i]);
    }

    if (!calculateList) {
        calculateList = [];
        for (k = 0; k < frequencyBinCount; k++) {
            calculateList.push(k);
        }
    }

    for (i = 0; i < calculateList.length; i++) {
        k = calculateList[i];
        frequencyBin = getFrequencyBin(waveAnalyser, k, N);
        frequencyData.push(frequencyBin.decibel);
        unitPhaseData.push(frequencyBin.unitPhase);
    }

    return frequencyData;
}

function getFrequencyBin(waveAnalyser, k, N) {
    var samplePerPeriod,

    samplePerPeriod = (k === 0)
        ? Infinity       // DC-offset (0 Hz)
        : N / k;
    waveAnalyser.setSamplePerPeriod(samplePerPeriod);

    return {
        decibel: waveAnalyser.getDecibel(),
        unitPhase: waveAnalyser.getUnitPhase()
    };
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

function drawUnitPhaseData(ctx, data, dataDecibel) {
    var i, B = 100;

    for (i = 5; i < data.length; i++) {

        if (i === 5 || i === 7 || i === 11) {
            drawLine(ctx, i * B, 5, (i + 1) * B, 5);
        }

        drawLine(ctx, i * B, 10, (i + 1) * B, 10);
        drawLine(ctx, i * B, 10 + B, (i + 1) * B, 10 + B);
        drawLine(ctx, i * B, 10, i * B, 10 + B);
        drawLine(ctx, (i + 1) * B, 10, (i + 1) * B, 10 + B);

        drawLine(ctx,
            i * B + B * 0.5,
            10 + B * 0.5,
            i * B + B * 0.5 + B * 0.5 * Math.cos(data[i] * 2 * Math.PI),
            10 + B * 0.5 - B * 0.5 * Math.sin(data[i] * 2 * Math.PI)
        );
    }
}
