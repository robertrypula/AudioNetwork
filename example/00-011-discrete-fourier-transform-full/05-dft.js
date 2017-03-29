// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function discreteFourierTransformInitialize() {
    var element, frequencyDomainChartWidth;

    frequencyDomainQueue = new Queue(frequencyBinSize);
    frequencyBinQueue = new Queue(frequencyBinSize);
    element = document.getElementById('frequency-domain');
    frequencyDomainChartWidth = frequencyBinSize *
        (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart = new FrequencyDomainChart(
        element, frequencyDomainChartWidth, FREQUENCY_BIN_CHART_HEIGHT, frequencyDomainQueue,
        amplitudeDecibelMin,
        FREQUENCY_BIN_CHART_RADIUS, FREQUENCY_BIN_CHART_BAR_WIDTH, FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH
    );

    element = document.getElementById('frequency-domain-visualizer-overlay');
    element.style.width = (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH) + 'px';
    element.style.height = FREQUENCY_BIN_CHART_HEIGHT + 'px';
    element.style.top = -FREQUENCY_BIN_CHART_HEIGHT + 'px';
}

function discreteFourierTransformUpdate() {
    var binStep, i, samplePerPeriod, frequencyBin, chartWidth;

    frequencyDomainQueue.setSizeMax(frequencyBinSize);
    frequencyBinQueue.setSizeMax(frequencyBinSize);
    binStep = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - i * binStep;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.pushEvenIfFull(frequencyBin.amplitudeDecibel);
        frequencyBinQueue.pushEvenIfFull(frequencyBin);
    }
    chartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart.setWidth(chartWidth);
    frequencyDomainChart.setPowerDecibelMin(amplitudeDecibelMin);       // TODO change to amplitude !!!!!!
}

function getFrequencyBin(timeDomainQueue, samplePerPeriod) {
    var i, r, x, y, sample, result, detail, amplitude;

    result = {
        samplePerPeriod: samplePerPeriod,
        real: 0,
        imm: 0,
        amplitudeDecibel: 0,
        phase: 0,
        detail: []
    };
    for (i = 0; i < timeDomainQueue.getSize(); i++) {
        sample = timeDomainQueue.getItem(i);
        r = 2 * Math.PI * (i + windowSampleOffset) / samplePerPeriod;   // TODO check it (windowSampleOffset) !!!!!!!!!
        x = -Math.cos(r);
        y = Math.sin(r);

        detail = {
            realUnit: x,
            immUnit: y,
            real: sample * x,
            imm: sample * y,
            sample: sample
        };
        result.real += detail.real;
        result.imm += detail.imm;

        result.detail.push(detail);
    }

    result.real /= timeDomainQueue.getSize();
    result.imm /= timeDomainQueue.getSize();

    amplitude = Math.sqrt(result.real * result.real + result.imm * result.imm);

    result.amplitudeDecibel = 10 * Math.log(amplitude) / Math.LN10;
    result.amplitudeDecibel = result.amplitudeDecibel < amplitudeDecibelMin ? amplitudeDecibelMin : result.amplitudeDecibel;

    result.phase = Util.findUnitAngle(result.real, result.imm);

    return result;
}
