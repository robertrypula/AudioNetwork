// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

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
    frequencyMax;

function init() {
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
