// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 32,
    CANVAS_HEIGHT = 201,
    BUFFER_NUMBER = 10,
    ctxRecordedBuffers,
    recordedBuffers,
    timeDomainData,
    bufferSize,
    canvasWidth,
    audioMonoIO,
    domGaugeRaw;

function init() {
    // domGaugeRaw = document.getElementById('max-absolute-amplitude-gauge-rawsample');
}

function onRecordClick() {
    bufferSize = 2 * 1024;
    canvasWidth = bufferSize * BUFFER_NUMBER;
    recordedBuffers = 0;
    timeDomainData = [];

    audioMonoIO = new AudioMonoIO(FFT_SIZE, bufferSize);
    ctxRecordedBuffers = getConfiguredCanvasContext(
        'canvas-recorded-blocks',
        canvasWidth,
        CANVAS_HEIGHT
    );

    setTimeout(function () {
        audioMonoIO.setSampleInHandler(sampleInHandler);
    }, 2000);
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
    element.width = width;
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
    limit = data.length;
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }

    for (x = 0; x < data.length; x += bufferSize) {
        drawLine(ctx, x, 0, x, 2 * hMid);
    }
}

// -----------------------------------------------------------------------
// data handlers

function sampleInHandler(monoIn) {
    var i;

    if (recordedBuffers >= BUFFER_NUMBER) {
        return;
    }

    timeDomainData.push(monoIn);
 
    recordedBuffers++;
    console.log('Recorded buffer: ', recordedBuffers);

    if (recordedBuffers === BUFFER_NUMBER) {
        draw();
        console.log('draw!');
    }
}

function draw() {
    var i, j, data;
    
    data = [];
    for (i = 0; i < timeDomainData.length; i++) {
        for (j = 0; j < timeDomainData[i].length; j++) {
            data.push(
                timeDomainData[i][j]
            );
        }
    }

    drawTimeDomainData(ctxRecordedBuffers, data);
    // console.log(timeDomainData);
}