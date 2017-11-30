// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    AudioMonoIO = AudioNetwork.Rewrite.WebAudio.AudioMonoIO,
    AudioMonoIOLite = AudioNetwork.Rewrite.WebAudio.AudioMonoIOLite,
    WavAudioFile = AudioNetwork.Rewrite.Util.WavAudioFile;

var
    audioMonoIO,
    audioMonoIOBufferSize,
    bufferListLimit,
    bufferList = [],
    domRecordButton,
    domRecordTime,
    domDownloadLinkContainer,
    isRecording = false;

function initAudioMonoIO(bufferSize) {
    if (audioMonoIO) {
        return;
    }
    audioMonoIO = new AudioMonoIO(AudioMonoIO.FFT_SIZE, bufferSize);
    audioMonoIOBufferSize = bufferSize;
    initCommon();
}

function initAudioMonoIOLite(bufferSize) {
    if (audioMonoIO) {
        return;
    }
    audioMonoIO = new AudioMonoIOLite(bufferSize);
    audioMonoIOBufferSize = bufferSize;
    initCommon();
}

function initCommon() {
    audioMonoIO.setSampleInHandler(sampleInHandler);

    document.getElementById('init-button-container').style.display = 'none';
    document.getElementById('init-lite-button-container').style.display = 'none';

    domRecordButton = document.getElementById('record-button');
    domRecordTime = document.getElementById('record-time');
    domDownloadLinkContainer = document.getElementById('download-link-container');

    domRecordButton.style.display = 'block';
}

function sampleInHandler(monoIn) {
    if (isRecording) {
        // This line is very important due to:
        // - http://stackoverflow.com/questions/24069400/web-audio-api-recording-works-in-firefox-but-not-chrome
        // - http://stackoverflow.com/questions/3978492/javascript-fastest-way-to-duplicate-an-array-slice-vs-for-loop/21514254#21514254
        bufferList.push(monoIn.slice(0));

        if (bufferList.length === bufferListLimit) {
            process();
        }
    }
}

function process() {
    var url, filename, i, j, buffer;

    isRecording = false;

    buffer = [];
    for (i = 0; i < bufferList.length; i++) {
        for (j = 0; j < bufferList[i].length; j++) {
            buffer.push(bufferList[i][j]);
        }
    }

    url = WavAudioFile.getBlobUrl(buffer, audioMonoIO.getSampleRate());
    filename = WavAudioFile.getFilename();

    domDownloadLinkContainer.innerHTML =
        '<a id="link" href="' + url + '" download="' + filename + '">' +
        'Download ' + filename +
        '</a>';
    document.getElementById('link').click();

    domRecordButton.innerHTML = 'Record again';
}

function onRecordClick() {
    var bufferDuration, recordTime;

    if (isRecording) {
        return;
    }

    domRecordButton.innerHTML = 'Recording...';

    bufferDuration = audioMonoIOBufferSize / audioMonoIO.getSampleRate();
    recordTime = parseInt(domRecordTime.value);
    bufferListLimit = Math.ceil(recordTime / bufferDuration);
    isRecording = true;
    bufferList.length = 0;
}
