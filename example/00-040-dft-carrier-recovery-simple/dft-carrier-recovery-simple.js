// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    // import stuff from AudioNetwork lib
    FrequencyDomainChart = AudioNetwork.Visualizer.FrequencyDomainChart,
    ConstellationDiagram = AudioNetwork.Visualizer.ConstellationDiagram,
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    WindowFunction = AudioNetwork.Common.WindowFunction,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    Queue = AudioNetwork.Common.Queue,
    Util = AudioNetwork.Common.Util,

    // default visualizers settings
    SAMPLE_CHART_HEIGHT = 50,
    SAMPLE_CHART_RADIUS = 1,
    SAMPLE_CHART_BAR_WIDTH = 1,
    SAMPLE_CHART_BAR_SPACING_WIDTH = 0,
    FREQUENCY_BIN_CHART_HEIGHT = 250,
    FREQUENCY_BIN_CHART_RADIUS = 2,
    FREQUENCY_BIN_CHART_BAR_WIDTH = 5,
    FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH = 1,
    CONSTELLATION_DIAGRAM_WIDTH = 290,
    CONSTELLATION_DIAGRAM_HEIGHT = 290,
    CONSTELLATION_DIAGRAM_POINT_HISTORY = 1,

    // settings (user is able to update those values via form)
    sineSampleSize = 1130,
    separateSineParameter = [
        { amplitude: 0.3, samplePerPeriod: 28, phase: 0 },
        { amplitude: 0.3, samplePerPeriod: 20, phase: 0 },
        { amplitude: 0.3, samplePerPeriod: 16, phase: 0 }
    ],
    windowSampleOffset = 0,
    windowSampleSize = 1024,
    windowFunctionEnabled = 1,
    powerDecibelMin = -80,
    frequencyBinSize = 160,
    frequencyBinSamplePerPeriodMax = 50,
    frequencyBinSamplePerPeriodMin = 10,
    frequencyBinIndexToExplain = Math.round(frequencyBinSize * 0.5),

    // helpers for sine creation
    separateSineCarrierGenerate = [],

    // data buffers
    separateSineQueue = [],
    summedSineQueue,
    timeDomainRawQueue,
    windowFunctionQueue,
    timeDomainProcessedQueue,
    frequencyDomainQueue,
    frequencyBinQueue,
    constellationDiagramQueue,

    // data visualizers
    separateSineChart = [],
    summedSineChart,
    timeDomainRawChart,
    windowFunctionChart,
    timeDomainProcessedChart,
    frequencyDomainChart,
    constellationDiagramChart;

// ----------------

function separateSineInitialize() {
    var i, carrierGenerate, queue, sampleChart, element;

    for (i = 0; i < separateSineParameter.length; i++) {
        carrierGenerate = new CarrierGenerate(separateSineParameter[i].samplePerPeriod);
        queue =  new Queue(sineSampleSize);
        element = document.getElementById('separate-sine-' + i);
        sampleChart = new SampleChart(element, sineSampleSize, SAMPLE_CHART_HEIGHT, queue);
        separateSineCarrierGenerate.push(carrierGenerate);
        separateSineQueue.push(queue);
        separateSineChart.push(sampleChart);
    }
}

function separateSineUpdate() {
    var i, j, carrierGenerate, queue, sampleChart;

    for (i = 0; i < separateSineParameter.length; i++) {
        carrierGenerate = separateSineCarrierGenerate[i];
        queue =  separateSineQueue[i];
        sampleChart = separateSineChart[i];

        carrierGenerate.setSamplePerPeriod(separateSineParameter[i].samplePerPeriod);
        queue.setSizeMax(sineSampleSize);
        sampleChart.setWidth(sineSampleSize);

        carrierGenerate.reset();
        carrierGenerate.addToQueue({
            amplitude: separateSineParameter[i].amplitude,
            duration: sineSampleSize,
            phase: separateSineParameter[i].phase / 360
        });

        for (j = 0; j < sineSampleSize; j++) {
            queue.pushEvenIfFull(carrierGenerate.getSample());
            carrierGenerate.nextSample();
        }
    }
}

// ----------------

function summedSineInitialize() {
    var element;

    summedSineQueue = new Queue(sineSampleSize);
    element = document.getElementById('summed-sine');
    summedSineChart = new SampleChart(element, sineSampleSize, SAMPLE_CHART_HEIGHT, summedSineQueue);

    element = document.getElementById('summed-sine-visualizer-overlay');
    element.style.height = SAMPLE_CHART_HEIGHT + 'px';
    element.style.top = -SAMPLE_CHART_HEIGHT + 'px';
}

function summedSineUpdate() {
    var i, j, sampleSum;

    summedSineQueue.setSizeMax(sineSampleSize);
    for (i = 0; i < sineSampleSize; i++) {
        sampleSum = 0;
        for (j = 0; j < separateSineQueue.length; j++) {
            sampleSum += separateSineQueue[j].getItem(i);
        }
        summedSineQueue.pushEvenIfFull(sampleSum);
    }
    summedSineChart.setWidth(sineSampleSize);
}

// ----------------

function timeDomainRawInitialize() {
    var element, chartWidth;

    timeDomainRawQueue = new Queue(windowSampleSize);
    element = document.getElementById('time-domain-raw');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainRawChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_HEIGHT, timeDomainRawQueue,
        SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH
    );
}

function timeDomainRawUpdate() {
    var i, chartWidth, element;

    timeDomainRawQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainRawQueue.pushEvenIfFull(
            summedSineQueue.getItem(windowSampleOffset + i)
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainRawChart.setWidth(chartWidth);

    element = document.getElementById('summed-sine-visualizer-overlay');
    element.style.left = windowSampleOffset + 'px';
    element.style.width = windowSampleSize + 'px';
}

// ----------------

function windowFunctionInitialize() {
    var element, chartWidth;

    windowFunctionQueue = new Queue(windowSampleSize);
    element = document.getElementById('window-function');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    windowFunctionChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_HEIGHT, windowFunctionQueue,
        SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH
    );
}

function windowFunctionUpdate() {
    var i, chartWidth;

    windowFunctionQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        windowFunctionQueue.pushEvenIfFull(
            windowFunctionEnabled ? WindowFunction.blackmanNuttall(i, windowSampleSize) : 1
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    windowFunctionChart.setWidth(chartWidth);
}

// ----------------

function timeDomainInitialize() {
    var element, chartWidth;

    timeDomainProcessedQueue = new Queue(windowSampleSize);
    element = document.getElementById('time-domain-processed');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainProcessedChart = new SampleChart(
        element, chartWidth, SAMPLE_CHART_HEIGHT, timeDomainProcessedQueue,
        SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH
    );
}

function timeDomainUpdate() {
    var i, chartWidth;

    timeDomainProcessedQueue.setSizeMax(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainProcessedQueue.pushEvenIfFull(
            windowFunctionQueue.getItem(i) * timeDomainRawQueue.getItem(i)
        );
    }
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainProcessedChart.setWidth(chartWidth);
}

// ----------------

function discreteFourierTransformInitialize() {
    var element, frequencyDomainChartWidth;

    frequencyDomainQueue = new Queue(frequencyBinSize);
    frequencyBinQueue = new Queue(frequencyBinSize);
    element = document.getElementById('frequency-domain');
    frequencyDomainChartWidth = frequencyBinSize *
        (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart = new FrequencyDomainChart(
        element, frequencyDomainChartWidth, FREQUENCY_BIN_CHART_HEIGHT, frequencyDomainQueue,
        powerDecibelMin,
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
    binStep = (frequencyBinSamplePerPeriodMax - frequencyBinSamplePerPeriodMin) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodMax - i * binStep;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.pushEvenIfFull(frequencyBin.powerDecibel);
        frequencyBinQueue.pushEvenIfFull(frequencyBin);
    }
    chartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart.setWidth(chartWidth);
    frequencyDomainChart.setPowerDecibelMin(powerDecibelMin);
}

function getFrequencyBin(timeDomainQueue, samplePerPeriod) {
    var i, r, cos, sin, sample, result, detail, power;

    result = {
        samplePerPeriod: samplePerPeriod,
        real: 0,
        imm: 0,
        powerDecibel: 0,
        phase: 0,
        detail: []
    };
    for (i = 0; i < timeDomainQueue.getSize(); i++) {
        sample = timeDomainQueue.getItem(i);
        r = 2 * Math.PI * i / samplePerPeriod;
        cos = Math.cos(r);
        sin = Math.sin(r);

        detail = {
            realUnit: cos,
            immUnit: sin,
            real: sample * cos,
            imm: sample * sin
        };
        result.real += detail.real;
        result.imm += detail.imm;

        result.detail.push(detail);
    }

    result.real /= timeDomainQueue.getSize();
    result.imm /= timeDomainQueue.getSize();

    power = Math.sqrt(result.real * result.real + result.imm * result.imm);

    result.powerDecibel = 10 * Math.log(power) / Math.LN10;
    result.powerDecibel = result.powerDecibel < powerDecibelMin ? powerDecibelMin : result.powerDecibel;

    result.phase = Util.findUnitAngle(result.real, result.imm);

    return result;
}

// ----------------

function constellationDiagramInitialize() {
    var element;

    constellationDiagramQueue = new Queue(CONSTELLATION_DIAGRAM_POINT_HISTORY);
    element = document.getElementById('constellation-diagram');
    constellationDiagramChart = new ConstellationDiagram(
        element, CONSTELLATION_DIAGRAM_WIDTH, CONSTELLATION_DIAGRAM_HEIGHT, constellationDiagramQueue, powerDecibelMin
    );
}

function constellationDiagramUpdate() {
    var frequencyBin;

    frequencyBin = frequencyBinQueue.getItem(frequencyBinIndexToExplain);
    constellationDiagramQueue.pushEvenIfFull({
        powerDecibel: frequencyBin.powerDecibel,
        phase: 0.125//frequencyBin.phase
    });
    constellationDiagramChart.setPowerDecibelMin(powerDecibelMin);
}

// ----------------

function frequencyBinExplanationInitialize() {

}

function frequencyBinExplanationUpdate() {
    var element;

    element = document.getElementById('frequency-domain-visualizer-overlay');
    element.style.left =
        ((FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH) * frequencyBinIndexToExplain) + 'px';
}

// ----------------

function parseIntFromForm(elementId) {
    return parseInt(document.getElementById(elementId).value);
}

function parseFloatFromForm(elementId) {
    return parseFloat(document.getElementById(elementId).value);
}

function formBindingTemplateToCode() {
    var i;

    sineSampleSize = parseIntFromForm('form-sine-sample-size');
    for (i = 0; i < separateSineParameter.length; i++) {
        separateSineParameter[i].samplePerPeriod = parseFloatFromForm('form-sine-' + i + '-sample-per-period');
        separateSineParameter[i].amplitude = parseFloatFromForm('form-sine-' + i + '-amplitude');
        separateSineParameter[i].phase = parseFloatFromForm('form-sine-' + i + '-phase');
    }
    windowSampleOffset = parseIntFromForm('form-window-sample-offset');
    windowSampleSize = parseIntFromForm('form-window-sample-size');
    windowFunctionEnabled = !!document.getElementById('form-window-function-enabled').checked;
    powerDecibelMin = parseIntFromForm('form-power-decibel-min');
    frequencyBinSize = parseIntFromForm('form-frequency-bin-size');
    frequencyBinSamplePerPeriodMax = parseFloatFromForm('form-frequency-bin-sample-per-period-max');
    frequencyBinSamplePerPeriodMin = parseFloatFromForm('form-frequency-bin-sample-per-period-min');
    frequencyBinIndexToExplain = parseIntFromForm('form-frequency-bin-index-to-explain');
}

function formBindingCodeToTemplate() {
    var i;

    document.getElementById('form-sine-sample-size').value = sineSampleSize;
    for (i = 0; i < separateSineParameter.length; i++) {
        document.getElementById('form-sine-' + i + '-sample-per-period').value = separateSineParameter[i].samplePerPeriod;
        document.getElementById('form-sine-' + i + '-amplitude').value = separateSineParameter[i].amplitude;
        document.getElementById('form-sine-' + i + '-phase').value = separateSineParameter[i].phase;
    }
    document.getElementById('form-window-sample-offset').value = windowSampleOffset;
    document.getElementById('form-window-sample-size').value = windowSampleSize;
    document.getElementById('form-window-function-enabled').checked = windowFunctionEnabled ? true : false;
    document.getElementById('form-power-decibel-min').value = powerDecibelMin;
    document.getElementById('form-frequency-bin-size').value = frequencyBinSize;
    document.getElementById('form-frequency-bin-sample-per-period-max').value = frequencyBinSamplePerPeriodMax;
    document.getElementById('form-frequency-bin-sample-per-period-min').value = frequencyBinSamplePerPeriodMin;
    document.getElementById('form-frequency-bin-index-to-explain').value = frequencyBinIndexToExplain;
}

function formSineDataChanged() {
    formBindingTemplateToCode();
    separateSineUpdate();
    summedSineUpdate();
    timeDomainRawUpdate();
    windowFunctionUpdate();
    timeDomainUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();
}

function formWindowDataChanged() {
    formBindingTemplateToCode();
    timeDomainRawUpdate();
    windowFunctionUpdate();
    timeDomainUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();
}

function formWindowFunctionDataChanged() {
    formBindingTemplateToCode();
    windowFunctionUpdate();
    timeDomainUpdate();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();
}

function formFrequencyDomainDataChanged() {
    formBindingTemplateToCode();
    discreteFourierTransformUpdate();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();
}

function formFrequencyBinExplanationDataChanged() {
    formBindingTemplateToCode();
    constellationDiagramUpdate();
    frequencyBinExplanationUpdate();
}

function startApp() {
    formBindingCodeToTemplate();

    separateSineInitialize();
    separateSineUpdate();

    summedSineInitialize();
    summedSineUpdate();

    timeDomainRawInitialize();
    timeDomainRawUpdate();

    windowFunctionInitialize();
    windowFunctionUpdate();

    timeDomainInitialize();
    timeDomainUpdate();

    discreteFourierTransformInitialize();
    discreteFourierTransformUpdate();

    constellationDiagramInitialize();
    constellationDiagramUpdate();

    frequencyBinExplanationInitialize();
    frequencyBinExplanationUpdate();
}

