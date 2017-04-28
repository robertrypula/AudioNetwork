var MONO = 1;

function writeString(view, offset, string) {
    var i;

    for (i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function clipToUnit(value) {
    value = value < -1 ? -1 : value;
    value = value > 1 ? 1 : value;

    return value;
}

function floatTo16BitPCM(output, offset, input) {
    var i, sample, sampleInt16;

    for (i = 0; i < input.length; i++) {
        sample = clipToUnit(input[i]);
        sampleInt16 = sample < 0
            ? sample * 0x8000
            : sample * 0x7FFF;
        output.setInt16(offset, sampleInt16, true);
        offset += 2;
    }
}

function getBlobUrl(blob) {
    return (window.URL || window.webkitURL).createObjectURL(blob);
}

function getAudioWavBlobUrl(buffer, sampleRate) {
    var
        arrayBuffer = new ArrayBuffer(44 + buffer.length * 2),
        view = new DataView(arrayBuffer),
        audioBlob,
        url;

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + buffer.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, MONO, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 4, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, MONO * 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, buffer.length * 2, true);

    floatTo16BitPCM(view, 44, buffer);

    audioBlob = new Blob(
        [view],
        {type: 'audio/wav'}
    );

    url = getBlobUrl(audioBlob);

    return url;
}

var
    audioMonoIO,
    bufferList = [],
    record = false,
    finished = false;

function init() {
    audioMonoIO = new AudioMonoIO(AudioMonoIO.FFT_SIZE, 8 * 1024);

    audioMonoIO.setSampleInHandler(sampleInHandler);
}

function sampleInHandler(monoIn) {
    if (!record || finished) {
        return
    }

    if (bufferList.length < 10) {
        bufferList.push(monoIn);
        // console.log('push');
    } else {
        // console.log(bufferList);
        // console.log('process');
        process();
        finished = true;
        record = false;
    }
}

function process() {
    var url, i, j, buffer = [];

    for (i = 0; i < bufferList.length; i++) {
        for (j = 0; j < bufferList[i].length; j++) {
            buffer.push(bufferList[i][j]);
        }
    }

    // console.log(buffer);

    url = getAudioWavBlobUrl(buffer, audioMonoIO.getSampleRate());
    document.getElementById('download-link-container').innerHTML =
        '<a id="link" href="' + url + '" download="output.wav">Download WAV</a>';
    document.getElementById('link').click();
}

function onRecordClick() {
    record = true;
}

function onResetClick() {
    finished = false;
    record = false;
    bufferList = [];
}
