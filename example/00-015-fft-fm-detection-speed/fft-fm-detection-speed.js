// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    audioMonoIO,
    fftSize,
    rxTimestep,
    txTimestep,
    txData,
    txDataIndex,
    carrierFrequency,
    carrierFrequencyBinIndex,
    frequencyBinIndexMin,
    frequencyBinIndexMax;

function init() {
    fftSize = getValue('#fft-size', 'int');
    audioMonoIO = new AudioMonoIO(fftSize);

    carrierFrequency = getValue('#carrier-frequency', 'float');
    carrierFrequency = FFTResult.getFrequencyOfClosestBin(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);
    setValue('#carrier-frequency', carrierFrequency);
    carrierFrequencyBinIndex = FFTResult.getBinIndex(carrierFrequency, audioMonoIO.getSampleRate(), fftSize);

    txData = getValue('#tx-data').split(' ');
    txDataIndex = 0;

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
        carrierFrequency - 50 * fftResult.getResolution(),
        carrierFrequency + 50 * fftResult.getResolution()
    );

    receivedIndex = loudestBinIndex - carrierFrequencyBinIndex;

    html('#log', (receivedIndex > 0 ? '+' : '') + receivedIndex + ', ', true);
}

function tx() {
    var frequency, frequencyBinIndex;

    frequencyBinIndex = carrierFrequencyBinIndex + parseInt(txData[txDataIndex]);
    frequency = FFTResult.getFrequency(frequencyBinIndex, audioMonoIO.getSampleRate(), fftSize);

    audioMonoIO.setOutputWave(frequency, 1);

    txDataIndex = (txDataIndex + 1) % txData.length;
}
