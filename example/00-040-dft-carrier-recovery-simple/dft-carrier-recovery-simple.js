var
    CarrierRecovery = AudioNetwork.Common.CarrierRecovery,
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    ConstellationDiagram = AudioNetwork.Visualizer.ConstellationDiagram,
    SampleChart = AudioNetwork.Visualizer.SampleChart,
    Queue = AudioNetwork.Common.Queue,


    TIME_DOMAIN_WIDTH = 1138,
    TIME_DOMAIN_HEIGHT = 50,

    sineSamplePerPeriod = [ 20, 32, 40 ],
    sineCarrierGenerate = [],
    sineQueue = [],
    sineChart = [],
    finalSignalQueue = [],
    finalSignalChart = [];


function initSine() {
    var i, j, cg, q, c, spp, element;

    for (i = 0; i < sineSamplePerPeriod.length; i++) {
        spp = sineSamplePerPeriod[i];

        cg = new CarrierGenerate(spp);
        q =  new Queue(TIME_DOMAIN_WIDTH);
        element = document.getElementById('sine-' + i);
        c = new SampleChart(element, TIME_DOMAIN_WIDTH, TIME_DOMAIN_HEIGHT, q);

        cg.addToQueue({
            amplitude: 1 / sineSamplePerPeriod.length,
            duration: TIME_DOMAIN_WIDTH,
            phase: 0
        });

        for (j = 0; j < TIME_DOMAIN_WIDTH; j++) {
            q.push(cg.getSample());
            cg.nextSample();
        }
        sineCarrierGenerate.push(cg);
        sineQueue.push(q);
        sineChart.push(c);
    }
}

function initFinalSignal() {
    var i, j, finalSignal, element;

    finalSignalQueue = new Queue(sineQueue[0].getSizeMax());
    for (i = 0; i < sineQueue[0].getSizeMax(); i++) {
        finalSignal = 0;
        for (j = 0; j < sineQueue.length; j++) {
            finalSignal += sineQueue[j].getItem(i);
        }
        finalSignalQueue.push(finalSignal);
    }
    element = document.getElementById('final-signal');
    finalSignalChart = new SampleChart(element, TIME_DOMAIN_WIDTH, TIME_DOMAIN_HEIGHT, finalSignalQueue);
}

function getFrequencyBin(timeDomain, samplePerPeriod) {
    var i, r, cos, sin, sample, result, detail;

    result = {
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
            realUnit: sample * cos,
            immUnit: sample * sin
        };
        result.detail.push(detail);
    }
}

function init() {
    initSine();
    initFinalSignal();
}

init();



/*
    sampleFrequency = 44100,
    burstDuration = sampleFrequency * 0.040,  // 1764 samples per burst, 25 baud / sec
    color = 1 ? 'rgba(130, 90, 200, 1)' : 'rgba(250, 250, 250, 1)',
    sampleMax = 5000,
    bufferSample = [],
    bufferPower = [],
    bufferPhase = [],
    samplesPerPeriod = [
        sampleFrequency / (7000),
        sampleFrequency / (7000 + 100),
        sampleFrequency / (7000 + 200),
        sampleFrequency / (7000 + 300),
        sampleFrequency / (7000 + 400),
        sampleFrequency / (7000 + 500),
        sampleFrequency / (7000 + 600),
        sampleFrequency / (7000 + 700),
        sampleFrequency / (7000 + 800),
        sampleFrequency / (7000 + 900)
    ],
    carrierRecovery = new CarrierRecovery(samplesPerPeriod[0], burstDuration),
    carrierGenerate = [],
    data = [
        [
            { amplitude: +0.00, duration: 100, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.000 },
            { amplitude: +0.00, duration: 0.5 * burstDuration, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.500 },
            { amplitude: +0.00, duration: 200, phase: +0.000 }
        ],
        [
            { amplitude: +0.00, duration: 100, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.250 },
            { amplitude: +0.00, duration: 0.5 * burstDuration, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.750 },
            { amplitude: +0.00, duration: 200, phase: +0.000 }
        ],
        [
            { amplitude: +0.00, duration: 100, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.500 },
            { amplitude: +0.00, duration: 0.5 * burstDuration, phase: +0.000 },
            { amplitude: +0.10, duration: burstDuration, phase: +0.125 + 0.000 },
            { amplitude: +0.00, duration: 200, phase: +0.000 }
        ]
    ]
;

function onSamplesPerPeriodChange(input) {
    carrierRecovery.setSamplePerPeriod(sampleFrequency / parseFloat(input.value));
    nextFrame();
}

function addNoise(buffer, amount) {
    var i;

    for (i = 0; i < buffer.length; i++) {
        buffer[i] += ((Math.random() * 2) - 1.0) * amount;
    }
}

function draw(canvasId, buffer) {
    var i;
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext("2d");
    var offsetY;

    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.clearRect(0, 0, 3000, 128);
    for (i = 0; i < buffer.length; i++) {
        offsetY = Math.round(buffer[i] * 64);
        ctx.beginPath();
        ctx.moveTo(i, 64);
        ctx.lineTo(i, 64 - (offsetY === 0 ? 1 : offsetY));
        ctx.closePath();
        ctx.stroke();
    }
}

function drawConstellationDiagram(canvasId, bufferPhase, bufferPower) {
    var i;
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext("2d");
    var x, y;

    ctx.fillStyle = color;

    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.clearRect(0, 0, 256, 256);
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.lineTo(256, 128);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.closePath();
    ctx.stroke();
    for (i = 0; i < bufferPhase.length; i++) {
        if (i < (100 + burstDuration) - 50 || i > (100 + burstDuration) + 50) {
            continue;
        }
        x = 128 + 128 * bufferPower[i] * Math.cos(2 * Math.PI * bufferPhase[i]);
        y = 128 - 128 * bufferPower[i] * Math.sin(2 * Math.PI * bufferPhase[i]);
        ctx.fillRect(x - 1, y - 1, 3, 3);
    }
}

function analyzeBufferSample(bufferSample, bufferPower, bufferPhase) {
    var i, carrierDetail, powerNormalized;

    for (i = 0; i < bufferSample.length; i++) {
        carrierRecovery.handleSample(bufferSample[i]);
        carrierDetail = carrierRecovery.getCarrierDetail();

        if (0) {
            powerNormalized = carrierDetail.power;
        } else {
            powerNormalized = (carrierDetail.powerDecibel + 20) / 20;
            powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
        }

        bufferPower.push(powerNormalized);
        bufferPhase.push(carrierDetail.phase);
    }
}

function nextFrame() {
    var i, j, dataTmp, sampleNumber, sample;

    carrierGenerate.length = 0;
    bufferSample.length = 0;
    bufferPower.length = 0;
    bufferPhase.length = 0;

    // create carrier generators and add data to queue
    for (i = 0; i < samplesPerPeriod.length; i++) {
        carrierGenerate.push(
            new CarrierGenerate(samplesPerPeriod[i], 50)
        );
        dataTmp = data[i % 3];
        for (j = 0; j < dataTmp.length; j++) {
            carrierGenerate[i].addToQueue(dataTmp[j]);
        }

    }

    // fill sample buffer
    for (sampleNumber = 0; sampleNumber < sampleMax; sampleNumber++) {
        sample = 0;
        for (i = 0; i < samplesPerPeriod.length; i++) {
            sample += carrierGenerate[i].getSample();
            carrierGenerate[i].nextSample();
        }
        bufferSample[sampleNumber] = sample;
    }

    // ----

    // addNoise(bufferSample, 0.2);
    analyzeBufferSample(bufferSample, bufferPower, bufferPhase);
    draw('buffer-sample', bufferSample);
    draw('buffer-power', bufferPower);
    draw('buffer-phase', bufferPhase);
    drawConstellationDiagram('constellation-diagram', bufferPhase, bufferPower);
}

var constellationDiagram;
var cdQueue;

function testConstellationDiagramV2() {
    cdQueue = new Queue(10);

    cdQueue.push(0.25); // x
    cdQueue.push(0.25); // y

    cdQueue.push(0.80); // x
    cdQueue.push(0.25); // y

    cdQueue.push(0.80); // x
    cdQueue.push(0.80); // y

    cdQueue.push(0.25); // x
    cdQueue.push(0.80); // y

    constellationDiagram = new ConstellationDiagram(
        document.getElementById('constellation-diagram-v2'),
        cdQueue,
        512,
        512
    );
}

function initialize() {
    nextFrame();
    // testConstellationDiagramV2();
}

initialize();


// --------------

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