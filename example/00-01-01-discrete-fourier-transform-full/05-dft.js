// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function discreteFourierTransformInitialize() {
    var element, frequencyDomainChartWidth;

    frequencyDomainQueue = new Queue(frequencyBinSize);
    frequencyBinQueue = new Queue(frequencyBinSize);
    element = document.getElementById('frequency-domain');
    frequencyDomainChartWidth = frequencyBinSize *
        (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart = new FrequencyDomainChart(
        element,
        frequencyDomainChartWidth,
        FREQUENCY_BIN_CHART_HEIGHT,
        frequencyDomainQueue,
        dBMin,
        FREQUENCY_BIN_CHART_RADIUS,
        FREQUENCY_BIN_CHART_BAR_WIDTH,
        FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH
    );

    element = document.getElementById('frequency-domain-visualizer-overlay');
    element.style.width = (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH) + 'px';
    element.style.height = FREQUENCY_BIN_CHART_HEIGHT + 'px';
    element.style.top = -FREQUENCY_BIN_CHART_HEIGHT + 'px';
}

function discreteFourierTransformUpdate() {
    // discreteFourierTransformUpdateLinearHertz();           // TODO it still have some errors -> fix it and enable
    discreteFourierTransformUpdateLinearSamplePerPeriod();
}

function discreteFourierTransformUpdateLinearHertz() {
    var
        N = timeDomainProcessedQueue.getSize(),
        samplePerPeriod,
        frequencyBin,
        kMin,
        kMax,
        kStep,
        i,
        k,
        chartWidth;

    frequencyDomainQueue.setSizeMax(frequencyBinSize);
    frequencyBinQueue.setSizeMax(frequencyBinSize);

    kMin = (frequencyBinSamplePerPeriodMax === Infinity) ? 0 : N / frequencyBinSamplePerPeriodMax;
    kMax = (frequencyBinSamplePerPeriodMin === Infinity) ? 0 : N / frequencyBinSamplePerPeriodMin;
    kStep = (kMax - kMin) / frequencyBinSize;

    for (i = 0; i < frequencyBinSize; i++) {
        k = kMin + i * kStep;
        samplePerPeriod = (k === 0) ? Infinity : N / k;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.pushEvenIfFull(frequencyBin.dB);
        frequencyBinQueue.pushEvenIfFull(frequencyBin);
    }
    
    chartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart.setWidth(chartWidth);
    frequencyDomainChart.setPowerDecibelMin(dBMin);
}

function discreteFourierTransformUpdateLinearSamplePerPeriod() {
    var
        binStep,
        i,
        samplePerPeriod,
        frequencyBin,
        chartWidth;

    frequencyDomainQueue.setSizeMax(frequencyBinSize);
    frequencyBinQueue.setSizeMax(frequencyBinSize);
    binStep = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;

    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - i * binStep;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.pushEvenIfFull(frequencyBin.dB);
        frequencyBinQueue.pushEvenIfFull(frequencyBin);
    }
    
    chartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart.setWidth(chartWidth);
    frequencyDomainChart.setPowerDecibelMin(dBMin);
}

function getFrequencyBin(timeDomainQueue, samplePerPeriod) {
    var
        N,
        n,
        xn,
        realUnit,
        immUnit,
        real,
        imm,
        realNormalized,
        immNormalized,
        r,
        amplitude,
        dB,
        phase,
        detail = [],
        detailItem;

    N = timeDomainQueue.getSize();
    real = 0;
    imm = 0;
    for (n = 0; n < N; n++) {
        xn = timeDomainQueue.getItem(n);

        r = (samplePerPeriod === Infinity)
            ? 0                                    // DC-Offset case (0 Hz -> samplePerPeriod is Infinite)
            : -2 * Math.PI * n / samplePerPeriod;

        realUnit = Math.cos(r);                    // 'in-phase' component
        immUnit = Math.sin(r);                     // 'quadrature' component

        // value of the sample alters 'unit vector' length
        // it could also 'rotate' vector 180 degrees in case of negative value
        real += realUnit * xn;
        imm += immUnit * xn;

        detailItem = {
            realUnit: realUnit,
            immUnit: immUnit,
            real: realUnit * xn,
            imm: immUnit * xn,
            sample: xn
        };
        detail.push(detailItem);
    }

    realNormalized = real / N;                     // normalize final vector
    immNormalized = imm / N;                       // normalize final vector
    amplitude = Math.sqrt(                         // compute length of the vector
        realNormalized * realNormalized +
        immNormalized * immNormalized
    );

    dB = 20 * Math.log(amplitude) / Math.LN10;     // convert into decibels (dB value computed from amplitudes needs to have 20 instead 10)

    phase = getPhaseFromComplexNumber(real, imm);  // phase of a sine wave related to this frequency bin

    return {
        real: real,
        imm: imm,
        // extras
        dB: dB,
        amplitude: amplitude,
        phase: phase,
        samplePerPeriod: samplePerPeriod,
        detail: detail
    };
}

function getPhaseFromComplexNumber(real, imm) {
    var phase;

    // get angle between positive X axis and vector counter-clockwise
    phase = findUnitAngle(real, imm);
    // sine wave without any phase offset is a complex number with real part equal zero
    // and imaginary part on the negative side (vector pointing downwards -> 270 degrees)
    phase = phase - 0.75;
    // correction from line above may produce negative phase so we need to fix it
    phase = phase < 0 ? phase + 1 : phase;
    // fix direction - when sine wave is moving to the right in time domain
    // then phase angle should increase counter-clockwise
    phase = 1 - phase;

    return phase;
}

function findUnitAngle(x, y) {
    var length, quarter, angle;

    length = Math.sqrt(x * x + y * y);
    length = (length < 0.000001) ? 0.000001 : length;    // prevents from dividing by zero

    //         ^             Legend:
    //  II     *     I        '!' = 0 degrees
    //         |              '*' = 90 degrees
    //  ----@--+--!---->      '@' = 180 degrees
    //         |              '%' = 270 degrees
    //  III    %     IV

    quarter = (y >= 0)
        ? (x >= 0 ? 1 : 2)
        : (x <= 0 ? 3 : 4);

    switch (quarter) {
        case 1:
            angle = Math.asin(y / length);
            break;
        case 2:
            angle = Math.asin(-x / length) + 0.5 * Math.PI;
            break;
        case 3:
            angle = Math.asin(-y / length) + 1.0 * Math.PI;
            break;
        case 4:
            angle = Math.asin(x / length) + 1.5 * Math.PI;
            break;
    }

    return angle / (2 * Math.PI);   // returns angle in range: <0, 1)
}
