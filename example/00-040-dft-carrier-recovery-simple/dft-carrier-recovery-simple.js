var
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    FrequencyDomainChart = AudioNetwork.Visualizer.FrequencyDomainChart,
    Queue = AudioNetwork.Common.Queue,
    WindowFunction = AudioNetwork.Common.WindowFunction,

    bufferSize = 1138 * 2,

    SAMPLE_CHART_HEIGHT = 50,
    SAMPLE_CHART_RADIUS = 1,
    SAMPLE_CHART_BAR_WIDTH = 1,
    SAMPLE_CHART_BAR_SPACING_WIDTH = 0,

    bufferSamplePerPeriod = [ 16, 20, 28 ],
    bufferCarrierGenerate = [],
    bufferQueue = [],
    bufferChart = [],
    bufferFinalQueue,
    bufferFinalChart,

    windowSampleOffset = 200,
    windowSampleSize = Math.round(1024),
    timeDomainRawQueue,
    timeDomainRawChart,

    windowFunctionQueue,
    windowFunctionChart,

    timeDomainProcessedQueue,
    timeDomainProcessedChart,

    FREQUENCY_BIN_CHART_HEIGHT = 250,
    FREQUENCY_BIN_CHART_RADIUS = 2,
    FREQUENCY_BIN_CHART_BAR_WIDTH = 5,
    FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH = 1,
    frequencyBinSize = 160,
    frequencyBinSamplePerPeriodFirst = 10,
    frequencyBinSamplePerPeriodLast = 50,
    frequencyDomainQueue,
    frequencyDomainChart,

    powerDecibelMin = -80;


function initBuffer() {
    var i, j, carrierGenerate, queue, sampleChart, samplePerPeriod, element, chartWidth;

    for (i = 0; i < bufferSamplePerPeriod.length; i++) {
        samplePerPeriod = bufferSamplePerPeriod[i];

        carrierGenerate = new CarrierGenerate(samplePerPeriod);
        queue =  new Queue(bufferSize);
        element = document.getElementById('sine-' + i);
        chartWidth = bufferSize;
        sampleChart = new SampleChart(element, chartWidth, SAMPLE_CHART_HEIGHT, queue);

        carrierGenerate.addToQueue({
            amplitude: 1 / bufferSamplePerPeriod.length,
            duration: bufferSize,
            phase: 0
        });

        for (j = 0; j < bufferSize; j++) {
            queue.push(carrierGenerate.getSample());
            carrierGenerate.nextSample();
        }
        bufferCarrierGenerate.push(carrierGenerate);
        bufferQueue.push(queue);
        bufferChart.push(sampleChart);
    }
}

function initBufferFinal() {
    var i, j, sampleSum, element, chartWidth;

    bufferFinalQueue = new Queue(bufferSize);
    for (i = 0; i < bufferSize; i++) {
        sampleSum = 0;
        for (j = 0; j < bufferQueue.length; j++) {
            sampleSum += bufferQueue[j].getItem(i);
        }
        bufferFinalQueue.push(sampleSum);
    }
    element = document.getElementById('final-signal');
    chartWidth = bufferSize;
    bufferFinalChart = new SampleChart(element, chartWidth, SAMPLE_CHART_HEIGHT, bufferFinalQueue);
}

function initTimeDomainRaw() {
    var i, element, chartWidth;

    timeDomainRawQueue = new Queue(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainRawQueue.push(
            bufferFinalQueue.getItem(windowSampleOffset + i)
        );
    }

    element = document.getElementById('time-domain-samples-from-window-raw');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainRawChart = new SampleChart(element, chartWidth, SAMPLE_CHART_HEIGHT, timeDomainRawQueue, SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH);
}

function initWindowFunction() {
    var i, element, chartWidth;

    windowFunctionQueue = new Queue(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        windowFunctionQueue.push(
            WindowFunction.blackmanNuttall(i, windowSampleSize)
        );
    }

    element = document.getElementById('window-function');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    windowFunctionChart = new SampleChart(element, chartWidth, SAMPLE_CHART_HEIGHT, windowFunctionQueue, SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH);
}

function initTimeDomainProcessed() {
    var i, element, chartWidth;

    timeDomainProcessedQueue = new Queue(windowSampleSize);
    for (i = 0; i < windowSampleSize; i++) {
        timeDomainProcessedQueue.push(
            windowFunctionQueue.getItem(i) * timeDomainRawQueue.getItem(i)
        );
    }

    element = document.getElementById('time-domain-samples-from-window-processed');
    chartWidth = windowSampleSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    timeDomainProcessedChart = new SampleChart(element, chartWidth, SAMPLE_CHART_HEIGHT, timeDomainProcessedQueue, SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH);
}

function computeDiscreteFourierTransform() {
    var binStep, i, samplePerPeriod, frequencyBin, element, frequencyDomainChartWidth;

    frequencyDomainQueue = new Queue(frequencyBinSize);
    binStep = (frequencyBinSamplePerPeriodLast - frequencyBinSamplePerPeriodFirst) / frequencyBinSize;
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodFirst + i * binStep;
        frequencyBin = getFrequencyBin(timeDomainProcessedQueue, samplePerPeriod);
        frequencyDomainQueue.push(frequencyBin.powerDecibel);
    }

    element = document.getElementById('frequency-domain');
    frequencyDomainChartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart = new FrequencyDomainChart(element, frequencyDomainChartWidth, FREQUENCY_BIN_CHART_HEIGHT, frequencyDomainQueue, powerDecibelMin, FREQUENCY_BIN_CHART_RADIUS, FREQUENCY_BIN_CHART_BAR_WIDTH, FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
}

function getFrequencyBin(timeDomainQueue, samplePerPeriod) {
    var i, r, cos, sin, sample, result, detail, power;

    result = {
        samplePerPeriod: samplePerPeriod,
        real: 0,
        imm: 0,
        powerDecibel: 0,
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

    return result;
}

function getFrequencyBinPowerDecibel(timeDomain, samplePerPeriod) {
    var windowSize, real, imm, i, sample, r, power, powerDecibel;

    windowSize = timeDomain.length;            // timeDomain array length is our window size
    real = 0;
    imm = 0;
    for (i = 0; i < windowSize; i++) {
        sample = timeDomain[i];
        r = 2 * Math.PI * i / samplePerPeriod; // compute current radians for 'unit vector'
        real += Math.cos(r) * sample;          // 'sample' value alters 'unit vector' length, it could also change
        imm += Math.sin(r) * sample;           // direction of vector in case of negative 'sample' values
    }
    real /= windowSize;
    imm /= windowSize;

    power = Math.sqrt(real * real + imm * imm);
    powerDecibel = 10 * Math.log(power) / Math.LN10;
    powerDecibel = powerDecibel < -80 ? -80 : powerDecibel;     // weak values only down to -80 decibels

    return powerDecibel;
}

function init() {
    initBuffer();
    initBufferFinal();
    initTimeDomainRaw();
    initWindowFunction();
    initTimeDomainProcessed();
    computeDiscreteFourierTransform();
}

init();



/*

function benchmark() {
    console.log('GO');
    var
        cg = new CarrierGenerate(5, 5),
        cr = new CarrierRecovery(5, 44100 * 0.75),
        secondsStart = new Date().getTime(),
        secondsEnd,
        sample,
        carrierDetail
        ;

    cg.addToQueue(
        { duration: 2.4 * 1000 * 1000, amplitude: 0.5, phase: 0.0 }
    );

    for (var i = 0; i < 2.00 * 1000 * 1000; i++) {
        sample = cg.getSample();
        cg.nextSample();
        cr.handleSample(sample);
        carrierDetail = cr.getCarrierDetail();
    }

    secondsEnd = new Date().getTime();
    console.log((secondsEnd - secondsStart) + ' ms');
    document.write((secondsEnd - secondsStart) + ' ms');
}

// setTimeout(benchmark, 3000);
*/