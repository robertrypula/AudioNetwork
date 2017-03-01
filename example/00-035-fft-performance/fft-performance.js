// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    fftSize,
    timestep,
    audioMonoIO,
    equalHistory,
    fftResultPrevious,
    refreshCounter;

function init() {

    fftSize = getValue('#fft-size', 'int');
    timestep = getValue('#timestep', 'int');

    equalHistory = [];
    fftResultPrevious = null;
    refreshCounter = 0;
    audioMonoIO = new AudioMonoIO(fftSize);

    setInterval(refresh, timestep);
    setInterval(log, 1000);
}

function getAvg(data) {
    var i, sum;

    sum = 0;
    for (i = 0; i < data.length; i++) {
        sum += data[i];
    }

    return sum / data.length;
}

function getIndex(data, type) {
    var index, condition, value, i;

    index = -1;
    value = undefined;
    condition = 0;
    for (i = 0; i < data.length; i++) {
        switch (type) {
            case 'min':
                condition = data[i] < value;
                break;
            case 'max':
                condition = data[i] > value;
                break;
        }
        if (index === -1 || condition) {
            value = data[i];
            index = i;
        }
    }

    return index;
}

function getFps(timeInMs) {
    return 1000 / timeInMs;
}

function log() {
    var i, logStr, lastNewIndex, timeDiff, speed, equalCount, avg, min, max;

    lastNewIndex = -1;
    speed = [];
    equalCount = 0;
    for (i = 0; i < equalHistory.length; i++) {
        if (equalHistory[i].equal) {
            equalCount++;
            continue;
        }

        if (lastNewIndex !== -1) {
            timeDiff = equalHistory[i].timestamp.getTime() - equalHistory[lastNewIndex].timestamp.getTime();
            speed.push(timeDiff);
        }

        lastNewIndex = i;
    }

    avg = getAvg(speed);
    min = speed[getIndex(speed, 'min')];
    max = speed[getIndex(speed, 'max')];

    logStr =
        'Equal: ' + equalCount + ' | ' +
        'Total: ' + equalHistory.length + ' | ' +
        'Average: ' + avg.toFixed(2) + ' ms (' + getFps(avg).toFixed(2) + ' FFT/s) | ' +
        'Best: ' + min + ' ms (' + getFps(min).toFixed(2) + ' FFT/s) | ' +
        'Worst: ' + max + ' ms (' + getFps(max).toFixed(2) + ' FFT/s) | ' +
        '<br/><br/>';

    html('#log', logStr, true);

    equalHistory.length = 0;
}

function refresh() {
    var fftResult = new FFTResult(audioMonoIO.getFrequencyData(), audioMonoIO.getSampleRate());

    if (refreshCounter !== 0) {
        equalHistory.push({
            refreshCounter: refreshCounter,
            equal: fftResult.equal(fftResultPrevious),
            timestamp: new Date()
        });
    }

    fftResultPrevious = fftResult;
    refreshCounter++;
}

