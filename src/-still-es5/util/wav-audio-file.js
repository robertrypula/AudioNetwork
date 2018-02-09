// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// This file is inspirated by 'Recorderjs' developed by Matt Diamond
// https://github.com/mattdiamond/Recorderjs

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.Util.WavAudioFile', WavAudioFile);

    WavAudioFile.$inject = [];

    function WavAudioFile() {
        var WavAudioFile;

        WavAudioFile = function () {
        };

        WavAudioFile.$$_MONO_CHANNEL_COUNT = 1;

        WavAudioFile.$$writeString = function (dataView, offset, string) {
            var i;

            for (i = 0; i < string.length; i++) {
                dataView.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        WavAudioFile.$$clipToUnit = function (value) {
            value = value < -1 ? -1 : value;
            value = value > 1 ? 1 : value;

            return value;
        };

        WavAudioFile.$$floatTo16BitPCM = function (output, offset, input) {
            var i, sample, sampleInt16;

            for (i = 0; i < input.length; i++) {
                sample = WavAudioFile.$$clipToUnit(input[i]);
                sampleInt16 = sample < 0
                    ? sample * 0x8000
                    : sample * 0x7FFF;
                output.setInt16(offset, sampleInt16, true);
                offset += 2;
            }
        };

        WavAudioFile.$$getObjectUrl = function (blob) {
            return (window.URL || window.webkitURL).createObjectURL(blob);
        };

        WavAudioFile.$$pad = function (number, size) {
            var s = '000000' + number;

            return s.substr(s.length - size);
        };

        WavAudioFile.getFilename = function () {
            var
                now = new Date(),
                filename;

            filename = '' +
                now.getFullYear() + '' +
                WavAudioFile.$$pad(now.getMonth() + 1, 2) + '' +
                WavAudioFile.$$pad(now.getDate(), 2) + '_' +
                WavAudioFile.$$pad(now.getHours(), 2) + '' +
                WavAudioFile.$$pad(now.getMinutes(), 2) + '' +
                WavAudioFile.$$pad(now.getSeconds(), 2) + '_' +
                WavAudioFile.$$pad(now.getMilliseconds(), 3) + '.wav';

            return filename;
        };

        WavAudioFile.getBlobUrl = function (buffer, sampleRate) {
            var
                arrayBuffer = new ArrayBuffer(44 + buffer.length * 2),
                dataView = new DataView(arrayBuffer),
                audioBlob;

            // RIFF identifier
            WavAudioFile.$$writeString(dataView, 0, 'RIFF');
            // RIFF chunk length
            dataView.setUint32(4, 36 + buffer.length * 2, true);
            // RIFF type
            WavAudioFile.$$writeString(dataView, 8, 'WAVE');
            // format chunk identifier
            WavAudioFile.$$writeString(dataView, 12, 'fmt ');
            // format chunk length
            dataView.setUint32(16, 16, true);
            // sample format (raw)
            dataView.setUint16(20, 1, true);
            // channel count
            dataView.setUint16(22, WavAudioFile.$$_MONO_CHANNEL_COUNT, true);
            // sample rate
            dataView.setUint32(24, sampleRate, true);
            // byte rate (sample rate * block align)
            dataView.setUint32(28, sampleRate * 4, true);
            // block align (channel count * bytes per sample)
            dataView.setUint16(32, WavAudioFile.$$_MONO_CHANNEL_COUNT * 2, true);
            // bits per sample
            dataView.setUint16(34, 16, true);
            // data chunk identifier
            WavAudioFile.$$writeString(dataView, 36, 'data');
            // data chunk length
            dataView.setUint32(40, buffer.length * 2, true);

            WavAudioFile.$$floatTo16BitPCM(dataView, 44, buffer);

            audioBlob = new Blob(
                [dataView],
                {type: 'audio/wav'}
            );

            return WavAudioFile.$$getObjectUrl(audioBlob);
        };

        return WavAudioFile;
    }

})();
