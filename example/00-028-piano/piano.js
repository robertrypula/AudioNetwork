// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    FFT_SIZE = 2 * 1024,
    DEFAULT_OCTAVE = 6,
    audioMonoIO,
    musicCalculator,
    octaveNumber = DEFAULT_OCTAVE,
    // harmonics from:
    // http://stackoverflow.com/questions/10702942/note-synthesis-harmonics-violin-piano-guitar-bass-frequencies-midi/11615460
    harmonicAmplitudeViolin = [
        1.0,                                   // 1
        0.286699025, 0.150079537, 0.042909002, // 2, 3, 4
        0.203797365, 0.229228698, 0.156931925, // 5, 6, 7
        0.115470898, 0.000000000, 0.097401803, // 8, 9, 10
        0.087653465, 0.052331036, 0.052922462, // 11, 12, 13
        0.038850593, 0.053554676, 0.053697434, // 14, 15, 16
        0.022270261, 0.013072562, 0.008585879, // 17, 18, 19
        0.005771505, 0.004343925, 0.002141371, // 20, 21, 22
        0.005343231, 0.000530244, 0.004711017, // 23, 24, 25
        0.009014153                            // 26
    ],
    harmonicAmplitudePiano = [
        1.0,                                   // 1
        0.399064778, 0.229404484, 0.151836061, // 2, 3, 4
        0.196754229, 0.093742264, 0.060871957, // 5, 6, 7
        0.138605419, 0.010535002, 0.071021868, // 8, 9, 10
        0.029954614, 0.051299684, 0.055948288, // 11, 12, 13
        0.066208224, 0.010067391, 0.007536790, // 14, 15, 16
        0.008196947, 0.012955577, 0.007316738, // 17, 18, 19
        0.006216476, 0.005116215, 0.006243983, // 20, 21, 22
        0.002860679, 0.002558108, 0.000000000, // 23, 24, 25
        0.001650392                            // 26
    ],
    animationFrameFirstCall = true,
    harmonicAmplitude = undefined;//harmonicAmplitudeViolin;

function init() {
    audioMonoIO = new AudioMonoIO(FFT_SIZE);
    musicCalculator = new MusicCalculator();
    generateHtml();
    animationFrameLoop();
}

function generateHtml() {
    generatePianoOctave();
    generateInfoTable();
}

function generatePianoOctave() {
    var
        octaveNumber = getValue('#octave-number', 'int'),
        semitoneNumberStart = musicCalculator.getFirstSemitoneNumber(octaveNumber),
        semitoneNumber,
        noteName,
        i,
        htmlResult;

    // yeah, I know - Angular would be better...
    htmlResult = '<div class="piano-key-octave">';
    for (i = 0; i <= MusicCalculator.SEMITONE_PER_OCTAVE; i++) {
        semitoneNumber = semitoneNumberStart + i;
        noteName = musicCalculator.getNoteName(semitoneNumber);
        htmlResult +=
            '<a ' +
            '    href="javascript:void(0)" ' +
            '    class="key-index-' + i + '" ' +
            '    onClick="pianoKeyClicked(' + semitoneNumber + ')">' +
            '    <span>' + noteName +'</span>' +
            '</a>';
    }
    htmlResult += '</div>';
    html('#piano-container', htmlResult);
}

function generateInfoTable() {
    var
        octaveNumber = getValue('#octave-number', 'int'),
        semitoneNumberStart = musicCalculator.getFirstSemitoneNumber(octaveNumber),
        semitoneNumber,
        table,
        tableContent,
        frequency,
        noteName,
        binIndex,
        frequencyOfClosestBin,
        i;

    // yeah, I know - Angular would be better...
    table = '<table>';
    table += '<tr>' +
        '<th class="th-0">Note<br/>name</th>' +
        '<th class="th-1">Note<br/>freq.</th>' +
        '<th class="th-2-3-4" colspan="3">Closest FFT bin</th>' +
        '<th class="th-5">&nbsp;</th>' +
        '</tr>';
    for (i = 0; i <= MusicCalculator.SEMITONE_PER_OCTAVE; i++) {
        semitoneNumber = semitoneNumberStart + i;
        frequency = musicCalculator.getFrequency(semitoneNumber);
        noteName = musicCalculator.getNoteName(semitoneNumber);
        binIndex = FFTResult.getBinIndex(
            frequency,
            audioMonoIO.getSampleRate(),
            FFT_SIZE
        );
        frequencyOfClosestBin = FFTResult.getFrequencyOfClosestBin(
            frequency,
            audioMonoIO.getSampleRate(),
            FFT_SIZE
        );
        tableContent = [];
        tableContent.push(
            '<td class="td-0">' + noteName + '</td>',
            '<td class="td-1">' + frequency.toFixed(2) + ' Hz' + '</td>',
            '<td class="td-2">' + '[' + binIndex + ']' + '</td>',
            '<td class="td-3">' + frequencyOfClosestBin.toFixed(2) + ' Hz' + '</td>',
            '<td class="td-4">' + '<span id="rx-semitone-db-' + semitoneNumber + '"></span>' + '</td>',
            '<td class="td-5">' + '<div class="rx-semitone-db-gauge">' +
                '<div id="rx-semitone-db-gauge-' + semitoneNumber + '"></div>' +
            '</div>' + '</td>'
        );
        table += '<tr>' + tableContent.join('') + '</tr>';
    }
    table += '</table>';
    html('#rx-info-table-container', table);
}

function animationFrameLoop() {
    if (!animationFrameFirstCall) {
        nextAnimationFrame();
    } else {
        animationFrameFirstCall = false;
    }
    requestAnimationFrame(animationFrameLoop);
}

function pianoKeyClicked(semitoneNumber) {
    var frequency = musicCalculator.getFrequency(semitoneNumber);

    setValue('#tx-frequency', frequency);
    setPeriodicWave();
}

function updatePhaseClicked(newPhase) {
    setValue('#tx-phase', newPhase);
    setPeriodicWave();
}

function muteClicked() {
    setValue('#tx-frequency', 0);
    setPeriodicWave();
}

function updatePhaseAndFrequencyClicked() {
    setPeriodicWave();
}

function octaveNumberChanged() {
    octaveNumber = getValue('#octave-number', 'int');

    if (octaveNumber !== 0 && !octaveNumber) {
        octaveNumber = DEFAULT_OCTAVE;
    }

    if (octaveNumber < MusicCalculator.OCTAVE_MIN) {
        octaveNumber = MusicCalculator.OCTAVE_MIN;
        setValue('#octave-number', octaveNumber);
    }
    if (octaveNumber > 9/*MusicCalculator.OCTAVE_MAX*/) {  // TODO fix frequencies above nyquist in octave 10
        octaveNumber = 9/*MusicCalculator.OCTAVE_MAX*/;
        setValue('#octave-number', octaveNumber);
    }

    generateHtml();
}

function setPeriodicWave() {
    var frequency, phase;

    frequency = getValue('#tx-frequency', 'float');
    phase = getValue('#tx-phase', 'float');
    audioMonoIO.setPeriodicWave(frequency, 0.1, phase, harmonicAmplitude);
}

function isSemitoneNumberInRange(semitoneNumber, semitoneNumberStart, semitoneNumberEnd) {
    return semitoneNumber &&
        semitoneNumber >= semitoneNumberStart &&
        semitoneNumber <= semitoneNumberEnd;
}

function nextAnimationFrame() {
    var
        fftResult = new FFTResult(
            audioMonoIO.getFrequencyData(FFT_SIZE),
            audioMonoIO.getSampleRate()
        ),
        semitoneNumberStart = musicCalculator.getFirstSemitoneNumber(octaveNumber),
        semitoneNumberEnd = musicCalculator.getFirstSemitoneNumber(octaveNumber + 1),
        frequencyStart = musicCalculator.getFrequency(semitoneNumberStart),
        frequencyEnd = musicCalculator.getFrequency(semitoneNumberEnd),
        visibleInOctave,
        loudestDecibel,
        loudestFrequency,
        frequency,
        semitoneNumber,
        noteName,
        semitoneDecibel,
        barWidth,
        semitoneIndexInOctave,
        element,
        i;

    loudestDecibel = fftResult.getLoudestDecibel(frequencyStart, frequencyEnd);
    loudestFrequency = fftResult.getLoudestFrequency(frequencyStart, frequencyEnd);
    semitoneNumber = musicCalculator.getSemitoneNumber(loudestFrequency);
    noteName = musicCalculator.getNoteName(semitoneNumber);

    // update general info
    html('#rx-frequency-hz', loudestFrequency.toFixed(2));
    html('#rx-frequency-db', loudestDecibel.toFixed(2));
    html('#rx-note-name', noteName);

    // update piano keys
    visibleInOctave = isSemitoneNumberInRange(
        semitoneNumber,
        semitoneNumberStart,
        semitoneNumberEnd
    );

    if (visibleInOctave) {
        semitoneIndexInOctave = semitoneNumber - semitoneNumberStart;
        if (!hasClass('.piano-key-octave a.key-index-' + semitoneIndexInOctave, 'active')) {
            removeClass('.piano-key-octave a', 'active');
            addClass('.piano-key-octave a.key-index-' + semitoneIndexInOctave, 'active');
        }
    } else {
        if (hasClass('.piano-key-octave a', 'active')) {
            removeClass('.piano-key-octave a', 'active');
        }
    }

    // update info table
    for (i = 0; i <= MusicCalculator.SEMITONE_PER_OCTAVE; i++) {
        semitoneNumber = semitoneNumberStart + i;
        frequency = musicCalculator.getFrequency(semitoneNumber);
        semitoneDecibel = fftResult.getDecibelFromFrequency(frequency);
        html(
            '#rx-semitone-db-' + semitoneNumber,
            semitoneDecibel.toFixed(2) + ' dB'
        );
        element = select('#rx-semitone-db-gauge-' + semitoneNumber)[0];

        barWidth = 100 - Math.abs(semitoneDecibel);
        barWidth = barWidth < 0 ? 0 : barWidth;
        barWidth = barWidth > 100 ? 100 : barWidth;
        element.style.width = barWidth + '%';
    }
}
