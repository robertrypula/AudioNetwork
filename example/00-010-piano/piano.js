// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    webAudioAPIMonoIO,
    musicCalculator,
    harmonicAmplitudeViolin = [
        1.0,
        0.286699025, 0.150079537, 0.042909002, // 1, 2, 3       // TODO do '--' on values
        0.203797365, 0.229228698, 0.156931925, // 4, 5, 6
        0.115470898, 0.000000000, 0.097401803, // 7, 8, 9
        0.087653465, 0.052331036, 0.052922462, // 10, 11, 12
        0.038850593, 0.053554676, 0.053697434, // 13, 14, 15
        0.022270261, 0.013072562, 0.008585879, // 16, 17, 18
        0.005771505, 0.004343925, 0.002141371, // 19, 20, 21
        0.005343231, 0.000530244, 0.004711017, // 22, 23, 24
        0.009014153                            // 25
    ],
    harmonicAmplitudePiano = [
        1.0,
        0.399064778, 0.229404484, 0.151836061, // 1, 2, 3       // TODO do '--' on values
        0.196754229, 0.093742264, 0.060871957, // 4, 5, 6
        0.138605419, 0.010535002, 0.071021868, // 7, 8, 9
        0.029954614, 0.051299684, 0.055948288, // 10, 11, 12
        0.066208224, 0.010067391, 0.007536790, // 13, 14, 15
        0.008196947, 0.012955577, 0.007316738, // 16, 17, 18
        0.006216476, 0.005116215, 0.006243983, // 19, 20, 21
        0.002860679, 0.002558108, 0.000000000, // 22, 23, 24
        0.001650392                            // 25
    ],
    harmonicAmplitude = harmonicAmplitudeViolin;

function init() {
    webAudioAPIMonoIO = new WebAudioAPIMonoIO();
    musicCalculator = new MusicCalculator();
    generatePianoOctave();
    refresh();
}

function pianoKeyClicked(semitoneNumber) {
    var frequency = musicCalculator.convertSemitoneNumberToFrequency(semitoneNumber);

    setValue('#tx-frequency', frequency);
    setOutputWave();
}

function updatePhaseClicked(newPhase) {
    setValue('#tx-phase', newPhase);
    setOutputWave();
}

function muteClicked() {
    setValue('#tx-frequency', 0);
    setOutputWave();
}

function updatePhaseAndFrequencyClicked() {
    setOutputWave();
}

function octaveNumberChanged() {
    var octaveNumber = getValue('#tx-octave-number', 'int');

    if (octaveNumber < MusicCalculator.OCTAVE_MIN) {
        octaveNumber = MusicCalculator.OCTAVE_MIN;
        setValue('#tx-octave-number', octaveNumber);
    }
    if (octaveNumber > MusicCalculator.OCTAVE_MAX) {
        octaveNumber = MusicCalculator.OCTAVE_MAX;
        setValue('#tx-octave-number', octaveNumber);
    }

    generatePianoOctave();
}

function setOutputWave() {
    var frequency, phase;

    frequency = getValue('#tx-frequency', 'float');
    phase = getValue('#tx-phase', 'float');
    webAudioAPIMonoIO.setOutputWave(frequency, 0.1, phase, harmonicAmplitude);
}

function findMaxIndex(data) {
    var maxIndex, max, i;

    maxIndex = -1;
    max = undefined;
    for (i = 0; i < data.length; i++) {
        if (maxIndex === -1 || data[i] > max) {
            max = data[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

function generatePianoOctave() {
    var
        txOctaveNumber = getValue('#tx-octave-number', 'int'),
        txSemitoneNumberStart = (txOctaveNumber - MusicCalculator.OCTAVE_HOLDING_A4) * MusicCalculator.SEMITONE_PER_OCTAVE,
        semitoneNumber,
        noteName,
        i,
        htmlResult;

    htmlResult = '<div class="piano-key-octave">';
    for (i = 0; i <= MusicCalculator.SEMITONE_PER_OCTAVE; i++) {
        semitoneNumber = txSemitoneNumberStart + i;
        noteName = musicCalculator.convertSemitoneNumberToNoteName(semitoneNumber);
        htmlResult += '<a href="javascript:void(0)" class="key-index-' + i + '" onClick="pianoKeyClicked(' + semitoneNumber + ')"><span>' + noteName +'</span></a>'
    }
    htmlResult += '</div>';
    html('#piano-container', htmlResult);
}

function refresh() {
    var
        fftSize = 16 * 1024,
        fft = webAudioAPIMonoIO.getFrequencyData(fftSize),
        txOctaveNumber = getValue('#tx-octave-number', 'int'),
        txSemitoneNumberStart = (txOctaveNumber - MusicCalculator.OCTAVE_HOLDING_A4) * MusicCalculator.SEMITONE_PER_OCTAVE,
        txSemitoneNumberEnd = (txOctaveNumber - MusicCalculator.OCTAVE_HOLDING_A4 + 1) * MusicCalculator.SEMITONE_PER_OCTAVE,
        decibelMax,
        frequencyBinMaxIndex,
        frequency,
        semitoneNumber,
        noteName,
        frequencyBinIndex,
        semitoneIndexInOctave,
        i,
        line;

    frequencyBinMaxIndex = findMaxIndex(fft);
    decibelMax = fft[frequencyBinMaxIndex];

    frequency = convertFrequencyBinIndexToFrequency(frequencyBinMaxIndex, webAudioAPIMonoIO.getSampleRate(), fftSize);
    semitoneNumber = musicCalculator.convertFrequencyToSemitoneNumber(frequency);
    noteName = musicCalculator.convertSemitoneNumberToNoteName(semitoneNumber);

    html('#rx-frequency-hz', (frequency).toFixed(2));
    html('#rx-frequency-db', (decibelMax).toFixed(2));
    html('#rx-note-name', noteName);

    if (semitoneNumber && semitoneNumber >= txSemitoneNumberStart && semitoneNumber <= txSemitoneNumberEnd) {
        semitoneIndexInOctave = semitoneNumber - txSemitoneNumberStart;
        if (!hasClass('.piano-key-octave a.key-index-' + semitoneIndexInOctave, 'active')) {
            removeClass('.piano-key-octave a', 'active');
            addClass('.piano-key-octave a.key-index-' + semitoneIndexInOctave, 'active');
        }
    }

    line = [];
    for (i = 0; i <= MusicCalculator.SEMITONE_PER_OCTAVE; i++) {
        semitoneNumber = txSemitoneNumberStart + i;
        frequency = musicCalculator.convertSemitoneNumberToFrequency(semitoneNumber);
        noteName = musicCalculator.convertSemitoneNumberToNoteName(semitoneNumber);
        frequencyBinIndex = convertFrequencyToFrequencyBinIndex(frequency, webAudioAPIMonoIO.getSampleRate(), fftSize);
        line.push(
            (frequency).toFixed(2) + ' ' +
            noteName + ': ' +
            (fft[frequencyBinIndex]).toFixed(2)
        );
    }
    html('#rx-test', '<br/>' + line.join('<br/>'));

    setTimeout(refresh, 80);
}
