// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    CANVAS_HEIGHT = 201,
    RECORD_TIME = 2,    // seconds
    PLAY_TIME = 10,      // seconds
    domCanvasContainer,
    domAudioMonoIoInitDiv,
    domRecordButton,
    domPlayButton,
    domLoopbackCheckbox,
    domSamplePerBit,
    domSequenceDuration,
    bufferSize,
    audioMonoIO,
    recordInProgress = false,
    playInProgress = false,
    recordNeverStarted = true,
    bufferRecorded,
    bufferRecordedLimit,
    timeDomainBlock = [];

/*
TODO:
    - add test signal via buffer: Chirp, ASK, FSK, BPSK
    - improovements in AudioMonoIO
 */

function init() {
    domCanvasContainer = document.getElementById('canvas-container');
    domAudioMonoIoInitDiv = document.getElementById('audio-mono-io-init-div');
    domRecordButton = document.getElementById('record-button');
    domPlayButton = document.getElementById('play-button');
    domLoopbackCheckbox = document.getElementById('loopback-checkbox');
    domSamplePerBit = document.getElementById('sample-per-bit');
    domSequenceDuration = document.getElementById('sequence-duration');
}

function onLoopbackCheckboxChange() {
    audioMonoIO.setLoopback(domLoopbackCheckbox.checked);
}

function onAudioMonoIoInitClick(bufferSizeValue) {
    var bufferDuration;

    bufferSize = bufferSizeValue;
    audioMonoIO = new AudioMonoIO(AudioMonoIO.FFT_SIZE, bufferSize);
    audioMonoIO.setSampleInHandler(sampleInHandler);

    onLoopbackCheckboxChange();

    bufferDuration = bufferSize / audioMonoIO.getSampleRate();
    bufferRecordedLimit = Math.ceil(RECORD_TIME / bufferDuration);

    domAudioMonoIoInitDiv.parentNode.removeChild(domAudioMonoIoInitDiv);
    domRecordButton.innerHTML = 'Start';
    domPlayButton.innerHTML = 'Start';
}

function onRecordClick() {
    if (recordInProgress || !audioMonoIO) {
        return;
    }

    domRecordButton.innerHTML = 'Recording...';
    recordNeverStarted = false;
    recordInProgress = true;
    bufferRecorded = 0;
    timeDomainBlock.length = 0;
    domCanvasContainer.innerHTML = '';
    domCanvasContainer.style.width = '0';
}

function onPlayClick() {
    var
        testSoundBuffer,
        buffer,
        bufferChannelData,
        bufferSourceNode,
        i;

    if (playInProgress || !audioMonoIO) {
        return;
    }

    testSoundBuffer = getTestSoundBuffer();

    domSequenceDuration.innerHTML =
        (testSoundBuffer.length / audioMonoIO.getSampleRate()).toFixed(3) + ' sec';

    buffer = audioMonoIO
        .$$audioContext
        .createBuffer(
            1,
            testSoundBuffer.length,
            audioMonoIO.getSampleRate()
        );
    bufferChannelData = buffer.getChannelData(0);
    for (i = 0; i < testSoundBuffer.length; i++) {
        bufferChannelData[i] = testSoundBuffer[i];
    }
    bufferSourceNode = audioMonoIO
        .$$audioContext
        .createBufferSource();
    bufferSourceNode.buffer = buffer;

    bufferSourceNode.connect(audioMonoIO.$$masterOut);
    bufferSourceNode.loop = true;
    bufferSourceNode.start();

    domPlayButton.innerHTML = 'Playing in a loop...';
    playInProgress = true;
}

// -----------------------------------------------------------------------
// utils

function generateSineWave(samplePerPeriod, amplitude, unitPhaseOffset, sample) {
    var x;

    x = 2 * Math.PI * (sample / samplePerPeriod - unitPhaseOffset);

    return amplitude * Math.sin(x);
}

function getSamplePerPeriod(frequency) {
    return audioMonoIO.getSampleRate() / frequency;
}

function pad(num, size) {
    var s = '000000' + num;

    return s.substr(s.length - size);
}

// -----------------------------------------------------------------------
// test sound

function getTestSoundBuffer() {
    var i, j, k, output, sample, sampleNumber, length, isOne, binaryStr, samplePerBit, modulation;

    output = [];
    samplePerBit = parseInt(domSamplePerBit.value);
    sampleNumber = 0;
    modulation = 0;
    while (true) {

        for (i = 0; i < 8; i++) {
            binaryStr = i.toString(2);
            binaryStr = pad(binaryStr, 3);

            console.log(modulation + ' ' + binaryStr);

            for (j = 0; j < binaryStr.length; j++) {
                isOne = (binaryStr[j] === '1');
                for (k = 0; k < samplePerBit; k++) {

                    switch (modulation) {
                        case 0:
                            sample = generateSineWave(32, isOne ? 1.0 : 0.05, 0, sampleNumber);
                            break;
                        case 1:
                            sample = generateSineWave(32, 1, isOne ? 0.0 : 0.5, sampleNumber);
                            break;
                        case 2:
                            sample = generateSineWave(isOne ? 16 : 32, 1, 0, sampleNumber);
                            break;
                        default:
                            sample = 0;
                    }
                    output.push(sample);
                    sampleNumber++;
                }
            }
            for (k = 0; k < samplePerBit; k++) {
                sample = 0;
                output.push(sample);
                sampleNumber++;
            }
        }

        modulation++;

        if (modulation === 3) {
            break;
        }
        // samplePerBit /= 2;
    }

    for (i = 0; i < 3000; i++) {
        output.push(
            -1 + Math.random() * 2
        );
    }

    return output;
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
    ctx.font = "12px Arial";

    return ctx;
}

function drawTimeDomainData(ctx, data, offset, sampleRate) {
    var limit, hMid, x, y1, y2, duration;

    clear(ctx);

    hMid = Math.floor(0.5 * CANVAS_HEIGHT);
    limit = data.length;
    for (x = 0; x < limit - 1; x++) {
        y1 = hMid * (1 - data[x]);
        y2 = hMid * (1 - data[x + 1]);
        drawLine(ctx, x, y1, x + 1, y2);
    }

    duration = data.length / sampleRate;
    for (x = 0; x < data.length; x += 128) {
        drawLine(ctx, x, 0, x, 12);
        ctx.fillText(
            ((duration * offset + x / sampleRate) * 1000).toFixed(1) + ' ms',
            x + 4,
            10
        );
        drawLine(ctx, x, CANVAS_HEIGHT, x, CANVAS_HEIGHT - 12);
        ctx.fillText(
            (offset * data.length + x).toFixed(0),
            x + 4,
            CANVAS_HEIGHT - 2
        );
    }

    drawLine(ctx, 0, 0, 0, 2 * hMid);
    ctx.fillText(
        'Buffer #' + offset,
        4,
        25
    );
}

// -----------------------------------------------------------------------
// data handlers

function sampleInHandler(monoIn) {
    if (recordNeverStarted) {
        return;
    }

    if (bufferRecorded >= bufferRecordedLimit) {
        recordInProgress = false;
        domRecordButton.innerHTML = 'Start again';
        return;
    }

    timeDomainBlock.push(monoIn);
    bufferRecorded++;

    if (bufferRecorded === bufferRecordedLimit) {
        showRecording();
    }
}

function showRecording() {
    var i, ctx, canvasHtml;

    canvasHtml = '';
    for (i = 0; i < timeDomainBlock.length; i++) {
        canvasHtml += '<canvas id="canvas-block-' + i + '"></canvas>';
    }
    domCanvasContainer.innerHTML = canvasHtml;
    domCanvasContainer.style.width = timeDomainBlock.length * bufferSize + timeDomainBlock.length + 'px';
    for (i = 0; i < timeDomainBlock.length; i++) {
        ctx = getConfiguredCanvasContext(
            'canvas-block-' + i,
            bufferSize,
            CANVAS_HEIGHT
        );
        drawTimeDomainData(ctx, timeDomainBlock[i], i, audioMonoIO.getSampleRate());
    }
}
