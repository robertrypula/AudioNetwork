'use strict';

var
    // import stuff from AudioNetwork lib
    SimpleAudioContext = AudioNetwork.Audio.SimpleAudioContext,
    CarrierRecovery = AudioNetwork.Common.CarrierRecovery,
    CarrierGenerate = AudioNetwork.Common.CarrierGenerate,
    PowerChart = AudioNetwork.Visualizer.PowerChart,
    Queue = AudioNetwork.Common.Queue,

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

    LOOPBACK_ACTIVE,
    WHITE_NOISE_ACTIVE,
    POWER_INFO_ACTIVE,
    POWER_CHART_ACTIVE,
    WEB_AUDIO_API_NODE_ACTIVE,
    DEBUG_SYMBOL_HISTORY_ACTIVE,

    SUB_CARRIER_SIZE,
    PILOT_FREQUENCY,
    POWER_CHART_WIDTH,
    POWER_CHART_HEIGHT,
    THRESHOLD,
    MINIMUM_POWER_DECIBEL,

    SYMBOL_DURATION,
    GUARD_DURATION,
    DFT_WINDOW_DURATION,
    NOTIFY_DURATION,
    REAL_SYMBOL_DURATION,
    SAMPLE_PER_SYMBOL,
    SAMPLE_PER_GUARD,
    SAMPLE_PER_DFT_WINDOW,
    SAMPLE_PER_NOTIFY,
    SAMPLE_PER_REAL_SYMBOL,

    OFDM_FREQUENCY_SPACING,

    // normal variables
    simpleAudioContext = new SimpleAudioContext(),
    scriptProcessorNodeSpeaker = simpleAudioContext.createScriptProcessor(1024, 1, 1),
    scriptProcessorNodeMicrophone = simpleAudioContext.createScriptProcessor(1024, 1, 1),
    analyserNode = simpleAudioContext.createAnalyser(),
    sampleGlobalCountMicrophone = 0,
    carrierGeneratePilot,
    carrierRecoveryPilot,
    carrierGenerate = [],
    carrierRecovery = [],
    pilotPrevious = false,
    carrierDetailHistory = [],
    powerChartPilot,
    powerChart = [];

function initConfig() {
    var
        symbolTimeFactor = parseFloat(document.getElementById('symbol-time-factor').value),
        notifyTimeResolution = parseInt(document.getElementById('notify-time-resolution').value),
        ofdmSpacingFactor = parseInt(document.getElementById('ofdm-spacing-factor').value);

    LOOPBACK_ACTIVE = !!document.getElementById('loopback-active').checked;
    WHITE_NOISE_ACTIVE = !!document.getElementById('white-noise-active').checked;
    POWER_INFO_ACTIVE = !!document.getElementById('power-info-active').checked;
    POWER_CHART_ACTIVE = !!document.getElementById('power-chart-active').checked;
    WEB_AUDIO_API_NODE_ACTIVE = !!document.getElementById('web-audio-api-node-active').checked;
    DEBUG_SYMBOL_HISTORY_ACTIVE = !!document.getElementById('debug-symbol-history-active').checked;
    
    SUB_CARRIER_SIZE = parseInt(document.getElementById('sub-carrier-size').value);
    PILOT_FREQUENCY = parseFloat(document.getElementById('pilot-frequency').value);    // Hz
    POWER_CHART_WIDTH = 600;                                                           // px
    POWER_CHART_HEIGHT = 10 * 20;                                                      // px
    THRESHOLD = -25;                                                                   // dB
    MINIMUM_POWER_DECIBEL = -99;                                                       // dB

    SYMBOL_DURATION = symbolTimeFactor * 0.08;                                         // seconds
    GUARD_DURATION = 1.5 * SYMBOL_DURATION;                                            // seconds
    DFT_WINDOW_DURATION = 0.5 * SYMBOL_DURATION;                                       // seconds
    NOTIFY_DURATION = SYMBOL_DURATION / notifyTimeResolution;                          // seconds
    REAL_SYMBOL_DURATION = SYMBOL_DURATION + GUARD_DURATION;                           // seconds
    SAMPLE_PER_SYMBOL = Math.round(simpleAudioContext.getSampleRate() * SYMBOL_DURATION);
    SAMPLE_PER_GUARD = Math.round(simpleAudioContext.getSampleRate() * GUARD_DURATION);
    SAMPLE_PER_DFT_WINDOW = Math.round(simpleAudioContext.getSampleRate() * DFT_WINDOW_DURATION);
    SAMPLE_PER_NOTIFY = Math.round(simpleAudioContext.getSampleRate() * NOTIFY_DURATION);
    SAMPLE_PER_REAL_SYMBOL = Math.round(simpleAudioContext.getSampleRate() * REAL_SYMBOL_DURATION);

    OFDM_FREQUENCY_SPACING = ofdmSpacingFactor / DFT_WINDOW_DURATION;                  // Hz

    document.getElementById('init-button').style.display = 'none';
}

function initCarrierObject() {
    var frequency, samplePerPeriod, i;

    samplePerPeriod = simpleAudioContext.getSampleRate() / PILOT_FREQUENCY;
    carrierGeneratePilot = new CarrierGenerate(samplePerPeriod);
    carrierRecoveryPilot = new CarrierRecovery(samplePerPeriod, SAMPLE_PER_DFT_WINDOW);

    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        frequency = PILOT_FREQUENCY + (i + 1) * OFDM_FREQUENCY_SPACING;
        samplePerPeriod = simpleAudioContext.getSampleRate() / frequency;

        carrierGenerate.push(new CarrierGenerate(samplePerPeriod));
        carrierRecovery.push(new CarrierRecovery(samplePerPeriod, SAMPLE_PER_DFT_WINDOW));
    }
}

function initNode() {
    if (!WEB_AUDIO_API_NODE_ACTIVE) {
        return;
    }

    scriptProcessorNodeSpeaker.onaudioprocess = function onaudioprocessSpeakerHandler(audioProcessingEvent) {
        var outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
        speakerOutputDataHandler(outputData);
    };
    scriptProcessorNodeMicrophone.onaudioprocess = function onaudioprocessMicrophoneHandler(audioProcessingEvent) {
        var inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        microphoneInputDataHandler(inputData);
    };

    if (LOOPBACK_ACTIVE) {
        scriptProcessorNodeSpeaker.connect(scriptProcessorNodeMicrophone);
        scriptProcessorNodeMicrophone.connect(analyserNode);
    } else {
        simpleAudioContext.getMicrophoneNode().connect(scriptProcessorNodeMicrophone);
        scriptProcessorNodeMicrophone.connect(analyserNode);
        scriptProcessorNodeSpeaker.connect(simpleAudioContext.getDestination());
    }
}

function initPowerChart() {
    var queue, i;

    if (!POWER_CHART_ACTIVE) {
        return;
    }

    queue = new Queue(POWER_CHART_WIDTH);
    powerChartPilot = {
        queue: queue,
        renderer: new PowerChart(
            document.getElementById('power-chart-pilot'), POWER_CHART_WIDTH, POWER_CHART_HEIGHT, queue
        )
    };

    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        queue = new Queue(POWER_CHART_WIDTH);
        powerChart.push({
            queue: queue,
            renderer: new PowerChart(
                document.getElementById('power-chart-' + i), POWER_CHART_WIDTH, POWER_CHART_HEIGHT, queue
            )
        });
    }
}

function initKeyboardEventGrabber() {
    var element = document.getElementById('keyboard-event-grabber');

    // events: keypress keyup keydown
    element.addEventListener('keypress', function (e) {
        send(e.keyCode);
        e.preventDefault();
    });
}

function init() {
    initConfig();
    initPowerChart();
    initCarrierObject();
    initNode();
    initKeyboardEventGrabber();
}

function speakerOutputDataHandler(outputData) {
    var sample, i;

    for (sample = 0; sample < outputData.length; sample++) {
        outputData[sample] = 0;

        outputData[sample] += carrierGeneratePilot.getSample();
        carrierGeneratePilot.nextSample();

        for (i = 0; i < SUB_CARRIER_SIZE; i++) {
            outputData[sample] += carrierGenerate[i].getSample();
            carrierGenerate[i].nextSample();
        }
    }
}

function microphoneInputDataHandler(inputData) {
    var sample, i;

    for (sample = 0; sample < inputData.length; sample++) {
        if (WHITE_NOISE_ACTIVE) {
            inputData[sample] += (Math.random() * 2 - 1) * 0.01;
        }
        carrierRecoveryPilot.handleSample(inputData[sample]);
        for (i = 0; i < SUB_CARRIER_SIZE; i++) {
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
    var
        carrierDetail = [],
        carrierDetailTemp,
        i;

    if (sampleGlobalCountMicrophone % SAMPLE_PER_NOTIFY !== 0) {
        return;
    }

    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        carrierDetailTemp = carrierRecovery[i].getCarrierDetail();
        carrierDetailTemp.powerDecibel = normalizeDecibel(carrierDetailTemp.powerDecibel);
        carrierDetail.push(carrierDetailTemp);
    }

    carrierDetailTemp = carrierRecoveryPilot.getCarrierDetail();
    carrierDetailTemp.powerDecibel = normalizeDecibel(carrierDetailTemp.powerDecibel);

    notifyHandler(carrierDetailTemp, carrierDetail);
}

function refreshPowerChart(carrierDetailPilot, carrierDetail) {
    var i;

    if (!POWER_CHART_ACTIVE) {
        return;
    }

    powerChartPilot.queue.pushEvenIfFull(carrierDetailPilot.powerDecibel);
    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        powerChart[i].queue.pushEvenIfFull(carrierDetail[i].powerDecibel);
    }
}

function refreshPowerInfo(carrierDetailPilot, carrierDetail) {
    var i;

    if (!POWER_INFO_ACTIVE) {
        return;
    }

    document.getElementById('power-decibel-pilot').innerHTML = Math.round(carrierDetailPilot.powerDecibel).toString();
    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        document.getElementById('power-decibel-' + i).innerHTML = Math.round(carrierDetail[i].powerDecibel).toString();
    }
}

function debugSymbolHistory(carrierDetailHistory, carrierDetailMiddle) {
    var
        log = '',
        i;

    if (!DEBUG_SYMBOL_HISTORY_ACTIVE) {
        return;
    }

    for (i = 0; i < carrierDetailHistory.length; i++) {
        log += carrierDetailHistory[i].symbol + ',';
    }
    console.log(log);
    console.log('        ', carrierDetailMiddle.phase.join(','));
}

function notifyHandler(carrierDetailPilot, carrierDetail) {
    var
        pilot = carrierDetailPilot.powerDecibel > THRESHOLD,
        carrierDetailMiddle,
        symbol,
        phase,
        i;

    refreshPowerChart(carrierDetailPilot, carrierDetail);
    refreshPowerInfo(carrierDetailPilot, carrierDetail);

    if (pilot && !pilotPrevious) {
        carrierDetailHistory.length = 0;
    }

    if (pilot) {
        symbol = 0;
        phase = [];
        for (i = 0; i < SUB_CARRIER_SIZE; i++) {
            symbol += carrierDetail[i].powerDecibel > THRESHOLD ? (1 << SUB_CARRIER_SIZE - 1 - i) : 0;
            phase.push(Math.round(carrierDetail[i].phase * 360));
        }
        carrierDetailHistory.push({
            symbol: symbol,
            phase: phase
        });
    }

    if (!pilot && pilotPrevious) {
        carrierDetailMiddle = carrierDetailHistory[Math.floor(carrierDetailHistory.length / 2)];
        debugSymbolHistory(carrierDetailHistory, carrierDetailMiddle);

        document.getElementById('symbol').innerHTML += '0x' + carrierDetailMiddle.symbol.toString(16);
        if (carrierDetailMiddle.symbol >= 32 && carrierDetailMiddle.symbol < 128) {
            document.getElementById('symbol').innerHTML += '[' + String.fromCharCode(carrierDetailMiddle.symbol)  + ']';
        }
        document.getElementById('symbol').innerHTML += ' ';
    }

    pilotPrevious = pilot;
}

function send(symbol) {
    var
        binary = '00000000' + (symbol >>> 0).toString(2),
        amplitude = 1 / (1 + SUB_CARRIER_SIZE),
        i;

    carrierGeneratePilot.addToQueue({ duration: SAMPLE_PER_SYMBOL, phase: 0, amplitude: amplitude });
    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        carrierGenerate[i].addToQueue({
            duration: SAMPLE_PER_SYMBOL, phase: 0, amplitude: amplitude * binary[binary.length - SUB_CARRIER_SIZE + i]
        });
    }

    carrierGeneratePilot.addToQueue({ duration: SAMPLE_PER_GUARD, phase: 0, amplitude: 0 });
    for (i = 0; i < SUB_CARRIER_SIZE; i++) {
        carrierGenerate[i].addToQueue({
            duration: SAMPLE_PER_GUARD, phase: 0, amplitude: 0
        });
    }
}

function sendText(text) {
    var i;

    for (i = 0; i < text.length; i++) {
        send(text.charCodeAt(i));
    }
}

function benchmark() {
    var
        data, textToSend, totalSample,
        timeBeginWebAPI, timeEndWebAPI, timeSpentWebAPI,
        timeBeginJSDate, timeEndJSDate, timeSpentJSDate,
        timeMax,
        result;

    textToSend = 'benchmark of audio network';

    timeBeginWebAPI = simpleAudioContext.getCurrentTime();
    timeBeginJSDate = (new Date()).getTime() / 1000;
    totalSample = SAMPLE_PER_REAL_SYMBOL * textToSend.length;
    sendText(textToSend);
    data = [];
    data.length = totalSample;
    speakerOutputDataHandler(data);
    microphoneInputDataHandler(data);
    timeEndWebAPI = simpleAudioContext.getCurrentTime();
    timeEndJSDate = (new Date()).getTime() / 1000;

    timeMax = Math.round(1000 * totalSample / simpleAudioContext.getSampleRate()) / 1000;
    timeSpentWebAPI = Math.round(1000 * (timeEndWebAPI - timeBeginWebAPI)) / 1000;
    timeSpentJSDate = Math.round(1000 * (timeEndJSDate - timeBeginJSDate)) / 1000;

    result =
        'realSymbolSpeed: ' + (Math.round(100 / REAL_SYMBOL_DURATION) / 100) + '\n' +
        'symbolToSend: ' + textToSend.length + '\n' +
        '\n' +
        'timeMax: ' + timeMax + '\n' +
        'timeSpentWebAPI: ' + timeSpentWebAPI + '\n' +
        'timeSpentJSDate: ' + timeSpentJSDate + '\n' +
        'loadWebAPI: ' + Math.round(100 * timeSpentWebAPI / timeMax) + '%' + '\n' +
        'loadJSDate: ' + Math.round(100 * timeSpentJSDate / timeMax) + '%';

    console.log(result);
    alert(result);
}
