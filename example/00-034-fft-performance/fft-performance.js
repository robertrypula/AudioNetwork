// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    fftSize,
    timestep,
    audioMonoIO,
    equalHistory,
    fftResultPrevious,
    refreshCounter,
    summaryLogged = false,
    summary = {
        average: [],
        best: [],
        worst: []
    };

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
    // fps -> Ffts Per Second :)
    return 1000 / timeInMs;
}

function log() {
    var i, logStr, lastNewIndex, timeDiff, speed, equalCount, avg, min, max;

    if (summary.average.length === 5) {
        if (!summaryLogged) {
            logSummary();
            summaryLogged = true;
        }
        return;
    }

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

    summary.average.push(avg);
    summary.best.push(min);
    summary.worst.push(max);

    html('#log', logStr, true);

    equalHistory.length = 0;
}

function logSummary() {
    var table, tableContent, i, average, best, worst;

    average = getAvg(summary.average);
    best = getAvg(summary.best);
    worst = getAvg(summary.worst);

    // yeah, I know - Angular or React would be better...
    table = '<table>';
    table += '<tr>' +
        '<th class="th-0">Average</th>' +
        '<th class="th-0">Best</th>' +
        '<th class="th-0">Worst</th>' +
        '</tr>';
    for (i = 0; i < 1; i++) {
        tableContent = [];
        tableContent.push(
            '<td class="td-0">' + average.toFixed(2) + ' ms (' + getFps(average).toFixed(2) + ' FFT/s)' + '</td>',
            '<td class="td-0">' + best.toFixed(2) + ' ms (' + getFps(best).toFixed(2) + ' FFT/s)' + '</td>',
            '<td class="td-0">' + worst.toFixed(2) + ' ms (' + getFps(worst).toFixed(2) + ' FFT/s)' + '</td>'
        );
        table += '<tr>' + tableContent.join('') + '</tr>';
    }
    table += '</table>';
    html('#log', table, true);
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

