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
        dBMin,
        FREQUENCY_BIN_CHART_RADIUS, FREQUENCY_BIN_CHART_BAR_WIDTH, FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH
    );

    element = document.getElementById('frequency-domain-visualizer-overlay');
    element.style.width = (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH) + 'px';
    element.style.height = FREQUENCY_BIN_CHART_HEIGHT + 'px';
    element.style.top = -FREQUENCY_BIN_CHART_HEIGHT + 'px';
}

function discreteFourierTransformUpdate() {
    var binStep, k, samplePerPeriod, frequencyBin, chartWidth;

    frequencyDomainQueue.setSizeMax(frequencyBinSize);
    frequencyBinQueue.setSizeMax(frequencyBinSize);
    binStep = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;
    for (k = 0; k < frequencyBinSize; k++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - k * binStep;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.pushEvenIfFull(frequencyBin.dB);
        frequencyBinQueue.pushEvenIfFull(frequencyBin);
    }
    chartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart.setWidth(chartWidth);
    frequencyDomainChart.setPowerDecibelMin(dBMin);
}

function getFrequencyBin(timeDomainQueue, samplePerPeriod) {
    var n, r, x, y, N, realNormalized, immNormalized, sample, result, detail, amplitude;

    result = {
        samplePerPeriod: samplePerPeriod,
        real: 0,
        imm: 0,
        dB: 0,
        amplitude: 0,
        phase: 0,
        detail: []
    };
    N = timeDomainQueue.getSize();
    for (n = 0; n < N; n++) {
        sample = timeDomainQueue.getItem(n);
        // TODO this formula is not like in traditional DFT, probably I should use traditional formula here and correct phase value later
        // TODO the reason to use non traditional formula was to produce correct phase angle in the end but I think that it should be changed
        // TODO to avoid any confusion
        if (samplePerPeriod === Infinity) {
            // DC-Offset case
            x = -1;
            y = 0;
        } else {
            r = 2 * Math.PI * (n + windowSampleOffset) / samplePerPeriod;
            x = -Math.cos(r);
            y = Math.sin(r);
        }

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

    realNormalized = result.real / N;
    immNormalized = result.imm / N;

    amplitude = Math.sqrt(
        realNormalized * realNormalized +
        immNormalized * immNormalized
    );

    result.dB = 20 * Math.log(amplitude) / Math.LN10;
    result.dB = result.dB < dBMin ? dBMin : result.dB;

    result.amplitude = amplitude;

    // TODO when formula from the loop will be changed to traditional we need to fix the phase because...
    // TODO ...sine waves without phase offset produces complex number that points downwards (negative imaginary axis)
    result.phase = Util.findUnitAngle(result.real, result.imm);

    return result;
}
