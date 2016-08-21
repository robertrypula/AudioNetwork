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
    SIZE = 4;

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
    // single
    log(':: single thread START ::');
    sSingleTotal.start();
    for (i = 0; i < SIZE; i++) {
        rwSingleStarted++;
        log('  started so far: ' + rwSingleStarted);
        rwSingle[i].computeCrazySineSum()
            .then(function (result) {
                rwSingleFinished++;
                log('  finished so far: ' + rwSingleFinished);
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
        rwMulti[i].computeCrazySineSum()
            .then(function (result) {
                rwMultiFinished++;
                log('  finished so far: ' + rwMultiFinished);
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

    threadReadyPromiseList = []
    for (i = 0; i < SIZE; i++) {
        rwMulti.push(new ReceiveMulticoreWorker());
        rwSingle.push(new ReceiveWorker());
        sMulti.push(new Stopwatch());
        sSingle.push(new Stopwatch());
        sMultiTotal = new Stopwatch();
        sSingleTotal = new Stopwatch();

        threadReadyPromiseList.push(rwMulti[i].getThreadReadyPromise());
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
