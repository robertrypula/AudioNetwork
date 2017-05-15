// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';


var SmartTimer;

SmartTimer = function (interval) {
    this.$$interval = interval;
    this.$$intervalCounter = 0;
    this.$$timeRefference = new Date();

    this.$$scheduleNext();
};

SmartTimer.prototype.setHandler = function (handler) {
    this.$$handler = handler;
};

SmartTimer.prototype.$$scheduleNext = function () {
    var
        newDate = new Date(this.$$timeRefference),
        now = new Date(),
        diff;

    this.$$intervalCounter++;
    newDate.setMilliseconds(
        newDate.getMilliseconds() + 1000 * this.$$interval * this.$$intervalCounter
    );

    diff = newDate.getTime() - now.getTime();
    setTimeout(this.$$notifyHandler.bind(this), diff);
};

SmartTimer.prototype.$$notifyHandler = function () {
    if (this.$$handler) {
        this.$$handler();
    }
    this.$$scheduleNext();
};

// ----------------------

var
    audioMonoIO,
    fftSize,
    range,
    rxTimestep,
    txTimestep,
    txData,
    txDataIndex,
    carrierFrequency,
    carrierFrequencyBinIndex,
    frequencyMin,
    frequencyMax,
    smartTimer;

function init() {
    smartTimer = new SmartTimer(0.3);
    smartTimer.setHandler(function () {
        var now = new Date();
        console.log(now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds());
    });

    fftSize = getValue('#fft-size', 'int');
    range = getValue('#range', 'int');
    audioMonoIO = new AudioMonoIO(fftSize);
    // audioMonoIO.setVolume(0.1);
    // audioMonoIO.setLoopback(true);

    carrierFrequency = getValue('#carrier-frequency', 'float');
    carrierFrequency = FFTResult.getFrequencyOfClosestBin(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);
    setValue('#carrier-frequency', carrierFrequency);
    carrierFrequencyBinIndex = FFTResult.getBinIndex(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);

    txData = getValue('#tx-data').split(' ');
    txDataIndex = 0;

    frequencyMin = carrierFrequency - range * FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize);
    frequencyMax = carrierFrequency + range * FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize);

    html(
        '#log',
        'FFT window duration: ' + (1000 * fftSize / audioMonoIO.getSampleRate()).toFixed(2) + ' ms<br/>' +
        'FFT resolution: ' + FFTResult.getResolution(audioMonoIO.getSampleRate(), fftSize) + ' Hz<br/>' +
        'Frequency min: ' + frequencyMin.toFixed(2) + ' Hz<br/>' +
        'Frequency max: ' + frequencyMax.toFixed(2) + ' Hz<br/><br/>',
        true
    );

    setInterval(log, 1000);
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

function startTx() {
    txTimestep = getValue('#tx-timestep', 'int');
    setInterval(tx, txTimestep);
}

function startRx() {
    rxTimestep = getValue('#rx-timestep', 'int');
    setInterval(rx, rxTimestep);
}

function log() {

}

function rx() {
    var
        fftResult = new FFTResult(audioMonoIO.getFrequencyData(), audioMonoIO.getSampleRate()),
        loudestBinIndex,
        receivedIndex;

    loudestBinIndex = fftResult.getLoudestBinIndex(
        carrierFrequency - range * fftResult.getResolution(),
        carrierFrequency + range * fftResult.getResolution()
    );

    receivedIndex = loudestBinIndex - carrierFrequencyBinIndex;

    html('#log', (receivedIndex > 0 ? '+' : '') + receivedIndex + ', ', true);
}

function tx() {
    var frequency, frequencyBinIndex, sample;

    sample = parseInt(txData[txDataIndex]) % (range + 1);
    frequencyBinIndex = carrierFrequencyBinIndex + sample;
    frequency = FFTResult.getFrequency(frequencyBinIndex, audioMonoIO.getSampleRate(), fftSize);

    audioMonoIO.setPeriodicWave(frequency, 1);

    txDataIndex = (txDataIndex + 1) % txData.length;
}
