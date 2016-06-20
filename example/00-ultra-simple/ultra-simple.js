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
    
    SYMBOL_TIME = 0.500,                                // seconds
    GUARD_INTERVAL = 2 * SYMBOL_TIME,
    DFT_WINDOW_TIME = 0.5 * SYMBOL_TIME,

    OFDM_FREQUENCY_SPACING = 1 / DFT_WINDOW_TIME;       // Hz
    NOTIFY_TIME = 0.1 * SYMBOL_TIME,                   // seconds
    SUB_CARRIER_SIZE = 2,
    PILOT_FREQUENCY = 5000,                             // Hz
    THRESHOLD = -30;                                    // dB

    SAMPLE_PER_SYMBOL_TIME = Math.round(Audio.getSampleRate() * SYMBOL_TIME),
    SAMPLE_PER_GUARD_INTERVAL = Math.round(Audio.getSampleRate() * GUARD_INTERVAL),
    SAMPLE_PER_DFT_WINDOW = Math.round(Audio.getSampleRate() * DFT_WINDOW_TIME),
    SAMPLE_PER_NOTIFY = Math.round(Audio.getSampleRate() * NOTIFY_TIME),
    SAMPLE_PER_PERIOD_PILOT = Audio.getSampleRate() / PILOT_FREQUENCY,

    // normals objects
    scriptProcessorNodeSpeakers = Audio.createScriptProcessor(1024, 1, 1),
    scriptProcessorNodeMicrophone = Audio.createScriptProcessor(1024, 1, 1),
    analyserNode = Audio.createAnalyser(),
    sampleGlobalCountMicrophone = 0,
    carrierGeneratePilot = new CarrierGenerate(SAMPLE_PER_PERIOD_PILOT),
    carrierRecoveryPilot = new CarrierRecovery(SAMPLE_PER_PERIOD_PILOT, SAMPLE_PER_DFT_WINDOW),
    carrierGenerate = [],
    carrierRecovery = [];


for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
    var
        frequency = PILOT_FREQUENCY + (i + 1) * OFDM_FREQUENCY_SPACING,
        samplePerPeriod = Audio.getSampleRate() / frequency;

    carrierGenerate.push(new CarrierGenerate(samplePerPeriod));
    carrierRecovery.push(new CarrierRecovery(samplePerPeriod, SAMPLE_PER_DFT_WINDOW));
}

if (0) {
    Audio.getMicrophoneNode().connect(scriptProcessorNodeMicrophone);
    scriptProcessorNodeMicrophone.connect(analyserNode);
    scriptProcessorNodeSpeakers.connect(Audio.getDestination());
} else {
    scriptProcessorNodeSpeakers.connect(scriptProcessorNodeMicrophone);
    scriptProcessorNodeMicrophone.connect(analyserNode);
}

scriptProcessorNodeSpeakers.onaudioprocess = function (audioProcessingEvent) {
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
};

scriptProcessorNodeMicrophone.onaudioprocess = function (audioProcessingEvent) {
    var inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

    for (var sample = 0; sample < inputData.length; sample++) {
        carrierRecoveryPilot.handleSample(inputData[sample]);
        for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
            carrierRecovery[i].handleSample(inputData[sample]);
        }
        sampleGlobalCountMicrophone++;
        notifyIfNeeded();
    }
};

function notifyIfNeeded() {
    var powerDecibel = [];

    if (sampleGlobalCountMicrophone % SAMPLE_PER_NOTIFY !== 0) {
        return;
    }

    for (var i = 0; i < SUB_CARRIER_SIZE; i++) {
        powerDecibel.push(carrierRecovery[i].getCarrierDetail().powerDecibel);
    }
    notify(carrierRecoveryPilot.getCarrierDetail().powerDecibel, powerDecibel);
}

var pilotPrevious = false;
var symbolHistory = [];

// TODO ultra bad code section below, remove it
var powerChartQueue0 = new AudioNetwork.Common.Queue(800);
var powerChart0 = new AudioNetwork.PhysicalLayer.PowerChart(document.getElementById('rx-power-chart-0'), 800, 2 * 80, powerChartQueue0);
var powerChartQueue1 = new AudioNetwork.Common.Queue(800);
var powerChart1 = new AudioNetwork.PhysicalLayer.PowerChart(document.getElementById('rx-power-chart-1'), 800, 2 * 80, powerChartQueue1);
var powerChartQueue2 = new AudioNetwork.Common.Queue(800);
var powerChart2 = new AudioNetwork.PhysicalLayer.PowerChart(document.getElementById('rx-power-chart-2'), 800, 2 * 80, powerChartQueue2);
// ----------------------------------------------


function notify(powerDecibelPilot, powerDecibel) {
    var pilot = powerDecibelPilot > THRESHOLD;

    // TODO ultra bad code section below, remove it
    var low = -75;
    powerDecibelPilot = powerDecibelPilot < low ? low : powerDecibelPilot;
    powerDecibel[0] = powerDecibel[0] < low ? low : powerDecibel[0];
    powerDecibel[1] = powerDecibel[1] < low ? low : powerDecibel[1];
    if (powerChartQueue0.isFull()) { powerChartQueue0.pop() } powerChartQueue0.push(powerDecibelPilot);
    if (powerChartQueue1.isFull()) { powerChartQueue1.pop() } powerChartQueue1.push(powerDecibel[0]);
    if (powerChartQueue2.isFull()) { powerChartQueue2.pop() } powerChartQueue2.push(powerDecibel[1]);
    // ------ end

    document.getElementById('powerDecibel').innerHTML = (
        Math.round(powerDecibelPilot).toString() + ' ' +
        Math.round(powerDecibel[0]).toString() + ' ' +
        Math.round(powerDecibel[1]).toString()
    );

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
        st = SAMPLE_PER_SYMBOL_TIME,
        gi = SAMPLE_PER_GUARD_INTERVAL,
        carrier0 = symbol >> 1 ? 1 : 0,
        carrier1 = symbol % 2 ? 1 : 0;

    console.log(carrier0, carrier1);

    carrierGeneratePilot.addToQueue([{ duration: st, phase: 0, amplitude: 1 }]);
    carrierGenerate[0].addToQueue([{ duration: st, phase: 0, amplitude: 0.5 * carrier0 }]);
    carrierGenerate[1].addToQueue([{ duration: st, phase: 0, amplitude: 0.5 * carrier1 }]);

    carrierGeneratePilot.addToQueue([{ duration: gi, phase: 0, amplitude: 0 }]);
    carrierGenerate[0].addToQueue([{ duration: gi, phase: 0, amplitude: 0 }]);
    carrierGenerate[1].addToQueue([{ duration: gi, phase: 0, amplitude: 0 }]);
}
