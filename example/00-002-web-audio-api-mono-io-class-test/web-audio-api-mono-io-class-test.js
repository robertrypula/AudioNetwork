// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var webAudioAPIMonoIO;

function init() {
    webAudioAPIMonoIO = new WebAudioAPIMonoIO();

    setInterval(function () {
        var fd = webAudioAPIMonoIO.getFrequencyData();
        var td = webAudioAPIMonoIO.getTimeDomainData();

        //console.log('fd', fd[0], fd[1], fd[2], fd[3]);
        //console.log('td', td[0], td[1], td[2], td[3]);
    }, 1000);

    webAudioAPIMonoIO.setSampleInHandler(function (data) {
        var max = Number.NEGATIVE_INFINITY;

        for (var i = 0; i < data.length; i++) {
            if (data[i] > max) {
                max = data[i];
            }
        }
        console.log('max', max);
    });

    webAudioAPIMonoIO.setSampleOutHandler(function (data) {
        for (var i = 0; i < data.length; i++) {
            //data[i] = 0.1 * (Math.random() * 2 - 1);
        }
    });

    webAudioAPIMonoIO.setOutputWave(800, 0.001);
}

