var
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    FrequencyDomainChart = AudioNetwork.Visualizer.FrequencyDomainChart,
    Queue = AudioNetwork.Common.Queue,

    bufferSize = 1138 * 4,

    SAMPLE_CHART_HEIGHT = 50,
    SAMPLE_CHART_RADIUS = 1,
    SAMPLE_CHART_BAR_WIDTH = 1,
    SAMPLE_CHART_BAR_SPACING_WIDTH = 0,

    FREQUENCY_BIN_CHART_HEIGHT = 200,
    FREQUENCY_BIN_CHART_RADIUS = 2,
    FREQUENCY_BIN_CHART_BAR_WIDTH = 7,
    FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH = 1,

    bufferSamplePerPeriod = [ 30, 50, 60 ],
    bufferCarrierGenerate = [],
    bufferQueue = [],
    bufferChart = [],
    bufferFinalQueue,
    bufferFinalChart,

    windowSampleOffset = 0,
    windowSampleSize = Math.round(bufferSize * 1.0),
    timeDomain = [],

/*
Blackman–Nuttall window

a0
- a1 * Math.cos(2 * Math.PI * n / (N - 1))
+ a2 - Math.cos(4 * Math.PI * n / (N - 1))
- a3 - Math.cos(6 * Math.PI * n / (N - 1))

a0 = 0.3635819;
a1 = 0.4891775;
a2 = 0.1365995;
a3 = 0.0106411;
*/

    frequencyBinSamplePerPeriodFirst = 10,
    frequencyBinSamplePerPeriodLast = 80,
    frequencyBinSize = 140,
    frequencyDomain = [],
    frequencyDomainChart,

    powerDecibelMin = -40;


function initBuffer() {
    var i, j, carrierGenerate, queue, sampleChart, samplePerPeriod, element, sampleChartWidth;

    for (i = 0; i < bufferSamplePerPeriod.length; i++) {
        samplePerPeriod = bufferSamplePerPeriod[i];

        carrierGenerate = new CarrierGenerate(samplePerPeriod);
        queue =  new Queue(bufferSize);
        element = document.getElementById('sine-' + i);
        sampleChartWidth = bufferSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
        sampleChart = new SampleChart(element, sampleChartWidth, SAMPLE_CHART_HEIGHT, queue, SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH);

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
    var i, j, sampleSum, element, sampleChartWidth;

    bufferFinalQueue = new Queue(bufferSize);
    for (i = 0; i < bufferSize; i++) {
        sampleSum = 0;
        for (j = 0; j < bufferQueue.length; j++) {
            sampleSum += bufferQueue[j].getItem(i);
        }
        bufferFinalQueue.push(sampleSum);
    }
    element = document.getElementById('final-signal');
    sampleChartWidth = bufferSize * (SAMPLE_CHART_BAR_WIDTH + SAMPLE_CHART_BAR_SPACING_WIDTH);
    bufferFinalChart = new SampleChart(element, sampleChartWidth, SAMPLE_CHART_HEIGHT, bufferFinalQueue, SAMPLE_CHART_RADIUS, SAMPLE_CHART_BAR_WIDTH, SAMPLE_CHART_BAR_SPACING_WIDTH);
}

function grabTimeDomainDataFromWindow() {
    var i;

    for (i = 0; i < windowSampleSize; i++) {
        timeDomain.push(
            bufferFinalQueue.getItem(windowSampleOffset + i)
        );
    }
}

function computeDiscreteFourierTransform() {
    var binStep, i, samplePerPeriod, frequencyBin, element, frequencyDomainChartWidth;

    frequencyDomain.length = 0;
    binStep = (frequencyBinSamplePerPeriodLast - frequencyBinSamplePerPeriodFirst) / (frequencyBinSize - 1);
    for (i = 0; i < frequencyBinSize; i++) {
        samplePerPeriod = frequencyBinSamplePerPeriodFirst + i * binStep;
        frequencyBin = getFrequencyBin(timeDomain, samplePerPeriod);
        frequencyDomain.push(frequencyBin.powerDecibel);
    }

    element = document.getElementById('frequency-domain');
    frequencyDomainChartWidth = frequencyBinSize * (FREQUENCY_BIN_CHART_BAR_WIDTH + FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
    frequencyDomainChart = new FrequencyDomainChart(element, frequencyDomainChartWidth, FREQUENCY_BIN_CHART_HEIGHT, frequencyDomain, powerDecibelMin, FREQUENCY_BIN_CHART_RADIUS, FREQUENCY_BIN_CHART_BAR_WIDTH, FREQUENCY_BIN_CHART_BAR_SPACING_WIDTH);
}

function getFrequencyBin(timeDomain, samplePerPeriod) {
    var i, r, cos, sin, sample, result, detail, power;

    result = {
        samplePerPeriod: samplePerPeriod,
        real: 0,
        imm: 0,
        powerDecibel: 0,
        detail: []
    };
    for (i = 0; i < timeDomain.length; i++) {
        sample = timeDomain[i];
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

    result.real /= timeDomain.length;
    result.imm /= timeDomain.length;

    power = Math.sqrt(result.real * result.real + result.imm * result.imm);

    result.powerDecibel = 10 * Math.log(power) / Math.LN10;
    result.powerDecibel = result.powerDecibel < powerDecibelMin ? powerDecibelMin : result.powerDecibel;

    return result;
}

function init() {
    initBuffer();
    initBufferFinal();
    grabTimeDomainDataFromWindow();
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