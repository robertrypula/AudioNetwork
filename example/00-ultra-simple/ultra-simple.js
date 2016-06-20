'use strict';

var
    // import stuff from AudioNetwork lib
    Audio = AudioNetwork.Injector.resolve('PhysicalLayer.Audio'),
    CarrierRecovery = AudioNetwork.Injector.resolve('PhysicalLayer.CarrierRecovery'),
    CarrierGenerate = AudioNetwork.Injector.resolve('PhysicalLayer.CarrierGenerate'),


    // +--+            +--+            +--+            +--+            +--+            +--+
    //     +--+            +--+            +--+            +--+            +--+            +--+
    //         +--+            +--+            +--+            +--+            +--+            +--+
    //             +--+            +--+            +--+            +--+            +--+            +--+
    // ----------------################--------------------------------################----------------
    //                    _____________                                   _____________
    // ________________,-`             `-,_____________________________,-`             `-,_____________

    // +------+        +------+        +------+        +------+        +------+        +------+
    //     +------+        +------+        +------+        +------+        +------+        +------+
    //         +------+        +------+        +------+        +------+        +------+        +------+
    //             +-------+       +------+        +------+        +------+        +------+        +------+
    // ----------------################--------------------------------################--------------------
    //                        _________                                       _________
    // ________________,---```         ```---,_________________________,---```         ```---,_____________

    LOOPBACK = 1,
    SUB_CARRIER_SIZE = 2,
    PILOT_FREQUENCY = 5000,                         // Hz
    THRESHOLD = -30,                                    // dB
    MINIMUM_POWER_DECIBEL = -75,                        // dB
    POWER_CHART_WIDTH = 800,
    POWER_CHART_HEIGHT = 2 * 80,
    
    SYMBOL_TIME = 1.00 * 0.08,                             // seconds
    GUARD_TIME = 2 * SYMBOL_TIME,                       // seconds
    DFT_WINDOW_TIME = 0.5 * SYMBOL_TIME,                // seconds
    NOTIFY_TIME = (1 / 8) * SYMBOL_TIME,                  // seconds
    SAMPLE_PER_SYMBOL = Math.round(Audio.getSampleRate() * SYMBOL_TIME),
    SAMPLE_PER_GUARD = Math.round(Audio.getSampleRate() * GUARD_TIME),
    SAMPLE_PER_DFT_WINDOW = Math.round(Audio.getSampleRate() * DFT_WINDOW_TIME),
    SAMPLE_PER_NOTIFY = Math.round(Audio.getSampleRate() * NOTIFY_TIME),

    OFDM_FREQUENCY_SPACING = 4 / DFT_WINDOW_TIME,       // Hz

    // normal variables
    scriptProcessorNodeSpeaker = Audio.createScriptProcessor(1024, 1, 1),
    scriptProcessorNodeMicrophone = Audio.createScriptProcessor(1024, 1, 1),
    analyserNode = Audio.createAnalyser(),
    sampleGlobalCountMicrophone = 0,
    carrierGeneratePilot,
    carrierRecoveryPilot,
    carrierGenerate = [],
    carrierRecovery = [],
    pilotPrevious = false,
    symbolHistory = [],
    powerChartPilot = {},
    powerChart = [];


function initCarrierObject() {
    var frequency, samplePerPeriod, i;

    samplePerPeriod = Audio.getSampleRate() / PILOT_FREQUENCY;
    carrierGeneratePilot = new CarrierGenerate(samplePerPeriod);
    carrierRecoveryPilot = new CarrierRecovery(samplePerPeriod, SAMPLE_PER_DFT_WINDOW);

    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        frequency = PILOT_FREQUENCY + (i + 1) * OFDM_FREQUENCY_SPACING;
        samplePerPeriod = Audio.getSampleRate() / frequency;

        carrierGenerate.push(new CarrierGenerate(samplePerPeriod));
        carrierRecovery.push(new CarrierRecovery(samplePerPeriod, SAMPLE_PER_DFT_WINDOW));
    }
}

function initNode() {
    scriptProcessorNodeSpeaker.onaudioprocess = scriptProcessorNodeSpeakerHandler;
    scriptProcessorNodeMicrophone.onaudioprocess = scriptProcessorNodeMicrophoneHandler;

    if (LOOPBACK) {
        scriptProcessorNodeSpeaker.connect(scriptProcessorNodeMicrophone);
        scriptProcessorNodeMicrophone.connect(analyserNode);
    } else {
        Audio.getMicrophoneNode().connect(scriptProcessorNodeMicrophone);
        scriptProcessorNodeMicrophone.connect(analyserNode);
        scriptProcessorNodeSpeaker.connect(Audio.getDestination());
    }
}

function initPowerChart() {
    var queue;

    powerChartPilot.queue = new AudioNetwork.Common.Queue(POWER_CHART_WIDTH);
    powerChartPilot.renderer = new AudioNetwork.PhysicalLayer.PowerChart(
        document.getElementById('power-chart-pilot'), POWER_CHART_WIDTH, POWER_CHART_HEIGHT, powerChartPilot.queue
    );

    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        queue = new AudioNetwork.Common.Queue(POWER_CHART_WIDTH);
        powerChart.push({
            queue: queue,
            renderer: new AudioNetwork.PhysicalLayer.PowerChart(
                document.getElementById('power-chart-' + i), POWER_CHART_WIDTH, POWER_CHART_HEIGHT, queue
            )
        });
    }
}

function init() {
    initPowerChart();
    initCarrierObject();
    initNode();
}

function scriptProcessorNodeSpeakerHandler(audioProcessingEvent) {
    var outputData = audioProcessingEvent.outputBuffer.getChannelData(0);

    for (var sample = 0; sample < outputData.length; sample++) {
        outputData[sample] = 0;

        outputData[sample] += carrierGeneratePilot.getSample();
        carrierGeneratePilot.nextSample();

        for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
            outputData[sample] += carrierGenerate[i].getSample();
            carrierGenerate[i].nextSample();
        }
    }
}

function scriptProcessorNodeMicrophoneHandler(audioProcessingEvent) {
    var inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

    for (var sample = 0; sample < inputData.length; sample++) {
        carrierRecoveryPilot.handleSample(inputData[sample]);
        for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
            carrierRecovery[i].handleSample(inputData[sample]);
        }
        sampleGlobalCountMicrophone++;
        notifyIfNeeded();
    }
}

function normalizeDecibel(value) {
    if (value === -Infinity) {
        value = MINIMUM_POWER_DECIBEL;
    }
    value = value < MINIMUM_POWER_DECIBEL ? MINIMUM_POWER_DECIBEL : value;

    return value;
}

function notifyIfNeeded() {
    var powerDecibel = [];

    if (sampleGlobalCountMicrophone % SAMPLE_PER_NOTIFY !== 0) {
        return;
    }

    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        powerDecibel.push(
            normalizeDecibel(carrierRecovery[i].getCarrierDetail().powerDecibel)
        );
    }
    notifyHandler(
        normalizeDecibel(carrierRecoveryPilot.getCarrierDetail().powerDecibel),
        powerDecibel);
}

function notifyHandler(powerDecibelPilot, powerDecibel) {
    var pilot = powerDecibelPilot > THRESHOLD;

    if (powerChartPilot.queue.isFull()) {
        powerChartPilot.queue.pop()
    }
    powerChartPilot.queue.push(powerDecibelPilot);
    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        if (powerChart[i].queue.isFull()) {
            powerChart[i].queue.pop()
        }
        powerChart[i].queue.push(powerDecibel[i]);
    }

    document.getElementById('power-decibel-pilot').innerHTML = Math.round(powerDecibelPilot).toString();
    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        document.getElementById('power-decibel-' + i).innerHTML = Math.round(powerDecibel[i]).toString();
    }

    if (pilot && !pilotPrevious) {
        symbolHistory.length = 0;
    }

    if (pilot) {
        symbolHistory.push(
            (powerDecibel[0] > THRESHOLD ? 2 : 0) + (powerDecibel[1] > THRESHOLD ? 1 : 0)
        );
    }

    if (!pilot && pilotPrevious) {
        var s = '';
        for (var i = 0; i < symbolHistory.length; i++) {
            s += symbolHistory[i] + ',';
        }
        console.log(s);
        document.getElementById('symbol').innerHTML += symbolHistory[Math.round(symbolHistory.length / 2)] + ' ';
    }

    pilotPrevious = pilot;
}

function send(symbol) {
    var
        binary = '00000000' + (symbol >>> 0).toString(2),
        amplitude = 1 / (1 + SUB_CARRIER_SIZE);

    carrierGeneratePilot.addToQueue([{ duration: SAMPLE_PER_SYMBOL, phase: 0, amplitude: amplitude }]);
    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        carrierGenerate[i].addToQueue([{
            duration: SAMPLE_PER_SYMBOL, phase: 0, amplitude: amplitude * binary[binary.length - SUB_CARRIER_SIZE + i]
        }]);
    }

    carrierGeneratePilot.addToQueue([{ duration: SAMPLE_PER_GUARD, phase: 0, amplitude: 0 }]);
    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        carrierGenerate[i].addToQueue([{
            duration: SAMPLE_PER_GUARD, phase: 0, amplitude: 0
        }]);
    }
}
