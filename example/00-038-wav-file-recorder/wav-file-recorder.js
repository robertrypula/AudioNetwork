var
    BUFFER_SIZE = 2 * 1024,
    audioMonoIO,
    bufferListLimit,
    bufferList = [],
    domRecordButton,
    domRecordTime,
    domDownloadLinkContainer,
    isRecording = false;

function initAudioMonoIO() {
    if (audioMonoIO) {
        return;
    }
    audioMonoIO = new AudioMonoIO(AudioMonoIO.FFT_SIZE, BUFFER_SIZE);
    initCommon();
}

function initAudioMonoIOLite() {
    if (audioMonoIO) {
        return;
    }
    audioMonoIO = new AudioMonoIOLite(BUFFER_SIZE);
    initCommon();
}

function initCommon() {
    audioMonoIO.setSampleInHandler(sampleInHandler);

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

    bufferDuration = BUFFER_SIZE / audioMonoIO.getSampleRate();
    recordTime = parseInt(domRecordTime.value);
    bufferListLimit = Math.ceil(recordTime / bufferDuration);
    isRecording = true;
    bufferList.length = 0;
}
