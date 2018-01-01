// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    ReceiveMulticoreWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveMulticoreWorker'),
    ReceiveWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveWorker'),
    Stopwatch = AudioNetwork.Injector.resolve('Common.Stopwatch'),
    SimplePromiseBuilder = AudioNetwork.Injector.resolve('Common.SimplePromiseBuilder');

var
    rwMulti = [],
    rwMultiStarted = 0,
    rwMultiFinished = 0,
    rwSingle = [],
    rwSingleStarted = 0,
    rwSingleFinished = 0,
    sMulti = [],
    sSingle = [],
    sSingleTotal,
    sMultiTotal,
    SIZE = 8,
    BUFFER_SIZE = 1,//256 * 1024,
    buffer = [];

function log(s) {
    var element = document.getElementById('log');

    console.log(s);
    element.innerHTML += s + '\n';
}

function compare() {
    var ratio = sSingleTotal.getDuration() / sMultiTotal.getDuration();

    log('ratio ' + ratio);
}

function run() {
    var i;

    // single
    log(':: single thread START ::');
    sSingleTotal.start();
    for (i = 0; i < SIZE; i++) {
        rwSingleStarted++;
        log('  started so far: ' + rwSingleStarted);
        rwSingle[i]
            .handleSampleBlock(buffer)
            .then(function (data) {
                rwSingleFinished++;
                log('  finished so far: ' + rwSingleFinished);
                log('      --> key: ' + data.key);
                log('      --> result: ' + data.result.powerDecibel + ' ' + data.result.phase);
                if (rwSingleFinished === SIZE) {
                    log(':: single thread END ::');
                    log('Duration: ' + sSingleTotal.stop().getDuration(true) + ' sec');
                    log('---');
                }
            });
    }

    // multi
    log(':: multi thread START ::');
    sMultiTotal.start();
    for (i = 0; i < SIZE; i++) {
        rwMultiStarted++;
        log('  started so far: ' + rwMultiStarted);
        rwMulti[i]
            .handleSampleBlock(buffer)
            .then(function (data) {
                rwMultiFinished++;
                log('  finished so far: ' + rwMultiFinished);
                log('      --> key: ' + data.key);
                log('      --> result: ' + data.result.powerDecibel + ' ' + data.result.phase);
                if (rwMultiFinished === SIZE) {
                    log(':: multi thread END ::');
                    log('Duration: ' + sMultiTotal.stop().getDuration(true) + ' sec');
                    log('---');
                    compare();
                }
            });
    }
}

function copyTest() {
    var i, arrayBuffer, arrayFloat, size, sw;

    var arrayFloatCopy_1;
    var arrayFloatCopy_2;

    sw = new Stopwatch();

    sw.start();
    size = 8 * 1024 * 1024;
    arrayBuffer = new ArrayBuffer(4 * size);
    arrayFloat = new Float32Array(arrayBuffer);
    for (i = 0; i < size; i++) {
        arrayFloat[i] = Math.sin(2 * Math.PI * (i / 16 - 0.25)) + Math.random();
    }
    log('Array generated in: ' + sw.stop().getDuration(true) + ' seconds');

    sw.reset().start();
    arrayFloatCopy_1 = new Float32Array(size);
    for (i = 0; i < size; i++) {
        arrayFloatCopy_1[i] = arrayFloat[i];
    }
    log('[NORMAL] Array copied in: ' + sw.stop().getDuration(true) + ' seconds');

    sw.reset().start();
    arrayFloatCopy_2 = new Float32Array(copy(arrayBuffer));
    log('[BUFFER] Array copied in: ' + sw.stop().getDuration(true) + ' seconds');

    var match = true;
    sw.reset().start();
    for (i = 0; i < size; i++) {
        if (arrayFloat[i] !== arrayFloatCopy_1[i] || arrayFloat[i] !== arrayFloatCopy_2[i]) {
            match = false;
            break;
        }
    }
    log('Verified in: ' + sw.stop().getDuration(true) + ' seconds. Arrays are ' + (match ? 'SAME' : 'DIFFERENT'));
    log('');
}

function copy(src)  {
    var dst = new ArrayBuffer(src.byteLength);

    new Uint8Array(dst).set(new Uint8Array(src));

    return dst;
}

function init() {
    var i, threadReadyPromiseList, sw, trp;

    copyTest();

    threadReadyPromiseList = [];
    for (i = 0; i < SIZE; i++) {
        rwMulti.push(new ReceiveMulticoreWorker(i));
        rwSingle.push(new ReceiveWorker(i));
        sMulti.push(new Stopwatch());
        sSingle.push(new Stopwatch());
        sMultiTotal = new Stopwatch();
        sSingleTotal = new Stopwatch();
        
        threadReadyPromiseList.push(rwMulti[i].getInitialization());
    }

    /*
     http://stackoverflow.com/questions/10100798

     */

    for (i = 0; i < BUFFER_SIZE; i++) {
        buffer.push(Math.sin(2 * Math.PI * (i / 16 - 0.25) ));
    }


    sw = new Stopwatch();
    trp = SimplePromiseBuilder.buildFromList(threadReadyPromiseList);
    log('Waiting for all threads...');
    sw.start();
    trp.then(function () {
        log(
            'All threads ready in ' +
            sw.stop().getDuration(true) + 'sec'
        );
        run();
    });
}

setTimeout(function () {
    document.write('<pre id="log"></pre>');
    setTimeout(init, 0);
}, 2000);
