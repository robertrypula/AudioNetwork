// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// MusicCalculator class implements Scientific Pitch Notation:
// https://en.wikipedia.org/wiki/Scientific_pitch_notation

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.MusicCalculator', MusicCalculator);

    MusicCalculator.$inject = [];

    function MusicCalculator() {
        var MusicCalculator;

        MusicCalculator = function (a4Frequency) {
            this.$$a4Frequency = a4Frequency
                ? a4Frequency
                : MusicCalculator.A4_FREQUENCY_DEFAULT;
        };

        MusicCalculator.C4_A4_DELTA = 9; // semitoneNumber = 0 means middle C (C4)
        MusicCalculator.A4_FREQUENCY_DEFAULT = 440;
        MusicCalculator.SEMITONE_PER_OCTAVE = 12;
        MusicCalculator.OCTAVE_MIN = 0;
        MusicCalculator.OCTAVE_HOLDING_A4 = 4;
        MusicCalculator.OCTAVE_MAX = 10;
        MusicCalculator.NOTE_NAME_LIST = [
            'C',  // white key
            'C#', // black key
            'D',  // white key
            'D#', // black key
            'E',  // white key
            'F',  // white key
            'F#', // black key
            'G',  // white key
            'G#', // black key
            'A',  // white key
            'A#', // black key
            'B'   // white key
        ];

        MusicCalculator.prototype.getSemitoneNumber = function (frequency) {
            var
                logBase2,
                semitoneNumber;

            if (frequency <= 0) {
                return null;  // TODO throw exception
            }

            logBase2 = Math.log(frequency / this.$$a4Frequency) / Math.log(2);
            semitoneNumber = Math.round(
                MusicCalculator.SEMITONE_PER_OCTAVE * logBase2 + MusicCalculator.C4_A4_DELTA
            );

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            return semitoneNumber;
        };

        MusicCalculator.prototype.getFrequency = function (semitoneNumber) {
            var
                semitoneNumberA4based,
                exponent;

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            semitoneNumberA4based = semitoneNumber - MusicCalculator.C4_A4_DELTA;
            exponent = semitoneNumberA4based / MusicCalculator.SEMITONE_PER_OCTAVE;

            return this.$$a4Frequency * Math.pow(2, exponent);
        };

        MusicCalculator.prototype.getNoteName = function (semitoneNumber) {
            // alias of static method
            return MusicCalculator.getNoteName(semitoneNumber);
        };

        MusicCalculator.getNoteName = function (semitoneNumber) {
            var
                semitoneNumberC4,
                semitoneNumberC0Based,
                octaveNumber,
                semitoneIndexInOctave;

            MusicCalculator.$$checkSemitoneNumberRange(semitoneNumber);

            semitoneNumberC4 = MusicCalculator.OCTAVE_HOLDING_A4 * MusicCalculator.SEMITONE_PER_OCTAVE;
            semitoneNumberC0Based = semitoneNumberC4 + semitoneNumber;
            octaveNumber = Math.floor(semitoneNumberC0Based / MusicCalculator.SEMITONE_PER_OCTAVE);
            semitoneIndexInOctave = semitoneNumberC0Based % MusicCalculator.SEMITONE_PER_OCTAVE;

            return MusicCalculator.NOTE_NAME_LIST[semitoneIndexInOctave] + octaveNumber;
        };

        MusicCalculator.prototype.getFirstSemitoneNumber = function (semitoneNumber) {
            // alias of static method
            return MusicCalculator.getFirstSemitoneNumber(semitoneNumber);
        };

        MusicCalculator.getFirstSemitoneNumber = function (octaveNumber) {
            var octaveNumber4Based;

            if (octaveNumber < 0) {
                return null;  // TODO throw exception
            }

            octaveNumber4Based = octaveNumber - MusicCalculator.OCTAVE_HOLDING_A4;

            return octaveNumber4Based * MusicCalculator.SEMITONE_PER_OCTAVE;
        };

        MusicCalculator.$$checkSemitoneNumberRange = function (semitoneNumber) {
            // TODO check range and throw exception if needed
        };

        return MusicCalculator;
    }

})();
