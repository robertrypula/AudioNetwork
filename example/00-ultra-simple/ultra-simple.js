var
    // import stuff from AudioNetwork lib
    Audio = AudioNetwork.Injector.resolve('PhysicalLayer.Audio'),
    CarrierRecovery = AudioNetwork.Injector.resolve('PhysicalLayer.CarrierRecovery'),
    CarrierGenerate = AudioNetwork.Injector.resolve('PhysicalLayer.CarrierGenerate'),

    // constant values
    // 2ST + 2 * 2ST = 2ST + 4ST = 6ST
    // 8 carriers:  3 bytes/s
    // 8 carriers + QPSK:  6 bytes/s

    SYMBOL_TIME = 0.050,                                // seconds
    FREQUENCY_SPACING = 1 / SYMBOL_TIME;                // Hz
    NOTIFY_TIME = SYMBOL_TIME / 4,                      // seconds
    FREQUENCY_PILOT = 5000,                             // Hz
    FREQUENCY_CARRIER_0 = 5000 +     FREQUENCY_SPACING, // Hz
    FREQUENCY_CARRIER_1 = 5000 + 2 * FREQUENCY_SPACING, // Hz
    THRESHOLD = -30;                                    // dB
    TX_SYMBOL_TIME_FACTOR = 2;
    SAMPLE_PER_SYMBOL = Math.round(Audio.getSampleRate() * SYMBOL_TIME),
    SAMPLE_PER_NOTIFY = Math.round(Audio.getSampleRate() * NOTIFY_TIME),
    SAMPLE_PER_PERIOD_PILOT = Audio.getSampleRate() / FREQUENCY_PILOT,
    SAMPLE_PER_PERIOD_CARRIER_0 = Audio.getSampleRate() / FREQUENCY_CARRIER_0,
    SAMPLE_PER_PERIOD_CARRIER_1 = Audio.getSampleRate() / FREQUENCY_CARRIER_1,

    // normals objects
    carrierGeneratePilot = new CarrierGenerate(SAMPLE_PER_PERIOD_PILOT),
    carrierGenerateCarrier0 = new CarrierGenerate(SAMPLE_PER_PERIOD_CARRIER_0),
    carrierGenerateCarrier1 = new CarrierGenerate(SAMPLE_PER_PERIOD_CARRIER_1),
    carrierRecoveryPilot = new CarrierRecovery(SAMPLE_PER_PERIOD_PILOT, SAMPLE_PER_SYMBOL),
    carrierRecoveryCarrier0 = new CarrierRecovery(SAMPLE_PER_PERIOD_CARRIER_0, SAMPLE_PER_SYMBOL),
    carrierRecoveryCarrier1 = new CarrierRecovery(SAMPLE_PER_PERIOD_CARRIER_1, SAMPLE_PER_SYMBOL),
    scriptProcessorNodeSpeakers = Audio.createScriptProcessor(1024, 1, 1),
    scriptProcessorNodeMicrophone = Audio.createScriptProcessor(1024, 1, 1),
    sampleGlobalCountMicrophone = 0,
    analyserNode = Audio.createAnalyser();

console.log(
    FREQUENCY_PILOT,
    FREQUENCY_CARRIER_0,
    FREQUENCY_CARRIER_1
);

scriptProcessorNodeSpeakers.onaudioprocess = function (audioProcessingEvent) {
    var outputData = audioProcessingEvent.outputBuffer.getChannelData(0);

    for (var sample = 0; sample < outputData.length; sample++) {
        outputData[sample] = 0;

        outputData[sample] += carrierGeneratePilot.getSample();
        carrierGeneratePilot.nextSample();

        outputData[sample] += carrierGenerateCarrier0.getSample();
        carrierGenerateCarrier0.nextSample();

        outputData[sample] += carrierGenerateCarrier1.getSample();
        carrierGenerateCarrier1.nextSample();
    }
};

scriptProcessorNodeMicrophone.onaudioprocess = function (audioProcessingEvent) {
    var inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

    for (var sample = 0; sample < inputData.length; sample++) {
        carrierRecoveryPilot.handleSample(inputData[sample]);
        carrierRecoveryCarrier0.handleSample(inputData[sample]);
        carrierRecoveryCarrier1.handleSample(inputData[sample]);
        sampleGlobalCountMicrophone++;

        if (sampleGlobalCountMicrophone % SAMPLE_PER_NOTIFY === 0) {
            notify(
                carrierRecoveryPilot.getCarrierDetail().powerDecibel,
                carrierRecoveryCarrier0.getCarrierDetail().powerDecibel,
                carrierRecoveryCarrier1.getCarrierDetail().powerDecibel
            );
        }
    }
};

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


function notify(powerDecibelPilot, powerDecibelCarrier0, powerDecibelCarrier1) {
    var pilot = powerDecibelPilot > THRESHOLD;

    // TODO ultra bad code section below, remove it
    var low = -75;
    powerDecibelPilot = powerDecibelPilot < low ? low : powerDecibelPilot;
    powerDecibelCarrier0 = powerDecibelCarrier0 < low ? low : powerDecibelCarrier0;
    powerDecibelCarrier1 = powerDecibelCarrier1 < low ? low : powerDecibelCarrier1;
    if (powerChartQueue0.isFull()) { powerChartQueue0.pop() } powerChartQueue0.push(powerDecibelPilot);
    if (powerChartQueue1.isFull()) { powerChartQueue1.pop() } powerChartQueue1.push(powerDecibelCarrier0);
    if (powerChartQueue2.isFull()) { powerChartQueue2.pop() } powerChartQueue2.push(powerDecibelCarrier1);
    // ------ end

    document.getElementById('powerDecibel').innerHTML = (
        Math.round(powerDecibelPilot).toString() + ' ' +
        Math.round(powerDecibelCarrier0).toString() + ' ' +
        Math.round(powerDecibelCarrier1).toString()
    );

    if (pilot && !pilotPrevious) {
        symbolHistory.length = 0;
    }

    if (pilot) {
        symbolHistory.push(
            (powerDecibelCarrier0 > THRESHOLD ? 2 : 0) + (powerDecibelCarrier1 > THRESHOLD ? 1 : 0)
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

if (1) {
    Audio.getMicrophoneNode().connect(scriptProcessorNodeMicrophone);
    scriptProcessorNodeMicrophone.connect(analyserNode);
    scriptProcessorNodeSpeakers.connect(Audio.getDestination());
} else {
    scriptProcessorNodeSpeakers.connect(scriptProcessorNodeMicrophone);
    scriptProcessorNodeMicrophone.connect(analyserNode);
}

function send(symbol) {
    var
        d = TX_SYMBOL_TIME_FACTOR * SAMPLE_PER_SYMBOL,
        carrier0 = symbol >> 1 ? 1 : 0,
        carrier1 = symbol % 2 ? 1 : 0;

    console.log(carrier0, carrier1);

    carrierGeneratePilot.addToQueue([{ duration: d, phase: 0, amplitude: 1 }]);
    carrierGenerateCarrier0.addToQueue([{ duration: d, phase: 0, amplitude: carrier0 }]);
    carrierGenerateCarrier1.addToQueue([{ duration: d, phase: 0, amplitude: carrier1 }]);

    carrierGeneratePilot.addToQueue([{ duration: 2 * d, phase: 0, amplitude: 0 }]);
    carrierGenerateCarrier0.addToQueue([{ duration: 2 * d, phase: 0, amplitude: 0 }]);
    carrierGenerateCarrier1.addToQueue([{ duration: 2 * d, phase: 0, amplitude: 0 }]);
}
