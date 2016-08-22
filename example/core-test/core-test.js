var
    ReceiveMulticoreWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveMulticoreWorker'),
    ReceiveWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveWorker'),
    Stopwatch = AudioNetwork.Injector.resolve('Common.Stopwatch'),
    SimplePromiseBuilder = AudioNetwork.Injector.resolve('Common.SimplePromiseBuilder'),
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
    SIZE = 4,
    BUFFER_SIZE = 256 * 1024,
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

function init() {
    var i, threadReadyPromiseList, sw, trp;

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
