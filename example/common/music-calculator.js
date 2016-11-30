// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// MusicCalculator class implements Scientific Pitch Notation:
// https://en.wikipedia.org/wiki/Scientific_pitch_notation

var MusicCalculator;

MusicCalculator = function (a4Frequency) {
    this.$$a4Frequency = a4Frequency ? a4Frequency : MusicCalculator.A4_FREQUENCY_DEFAULT;
};

MusicCalculator.C4_A4_DELTA = 9; // semitoneNumber = 0 means middle C (C4)
MusicCalculator.A4_FREQUENCY_DEFAULT = 440;
MusicCalculator.SEMITONE_PER_OCTAVE = 12;
MusicCalculator.OCTAVE_MIN = 0;
MusicCalculator.OCTAVE_HOLDING_A4 = 4;
MusicCalculator.OCTAVE_MAX = 10;
MusicCalculator.NOTE_NAME_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

MusicCalculator.prototype.convertFrequencyToSemitoneNumber = function (frequency) {
    var logBase2, semitoneNumber;

    if (frequency <= 0) {
        return null;  // TODO throw exception
    }

    logBase2 = Math.log(frequency / this.$$a4Frequency) / Math.log(2);
    semitoneNumber = Math.round(
        MusicCalculator.SEMITONE_PER_OCTAVE * logBase2 + MusicCalculator.C4_A4_DELTA
    );

    this.$$checkSemitoneNumberRange(semitoneNumber);

    return semitoneNumber;
};

MusicCalculator.prototype.convertSemitoneNumberToFrequency = function (semitoneNumber) {
    var semitoneNumberA4based, exponent;

    this.$$checkSemitoneNumberRange(semitoneNumber);

    semitoneNumberA4based = semitoneNumber - MusicCalculator.C4_A4_DELTA;
    exponent = semitoneNumberA4based / MusicCalculator.SEMITONE_PER_OCTAVE;

    return this.$$a4Frequency * Math.pow(2, exponent);
};

MusicCalculator.prototype.convertSemitoneNumberToNoteName = function (semitoneNumber) {
    var semitoneNumberC0Based, octaveNumber, semitoneIndexInOctave;

    this.$$checkSemitoneNumberRange(semitoneNumber);

    semitoneNumberC0Based = MusicCalculator.OCTAVE_HOLDING_A4 * MusicCalculator.SEMITONE_PER_OCTAVE + semitoneNumber;
    octaveNumber = Math.floor(semitoneNumberC0Based / MusicCalculator.SEMITONE_PER_OCTAVE);
    semitoneIndexInOctave = semitoneNumberC0Based % MusicCalculator.SEMITONE_PER_OCTAVE;

    return MusicCalculator.NOTE_NAME_LIST[semitoneIndexInOctave] + octaveNumber;
};

MusicCalculator.prototype.$$checkSemitoneNumberRange = function (semitoneNumber) {
    // TODO check range and throw exception if needed
};
