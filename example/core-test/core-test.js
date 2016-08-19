var
    ReceiveMulticoreWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveMulticoreWorker'),
    ReceiveWorker = AudioNetwork.Injector.resolve('PhysicalLayerCore.ReceiveWorker'),
    Stopwatch = AudioNetwork.Injector.resolve('Common.Stopwatch'),
    receiveMulticoreWorker,
    receiveWorker,
    stopwatch = new Stopwatch();

function run() {
    receiveMulticoreWorker = new ReceiveMulticoreWorker();
    receiveWorker = new ReceiveWorker();


    console.log(':: UI thread START ::');
    stopwatch.reset();
    stopwatch.start();
    receiveWorker.computeCrazySineSum()
        .then(function (result) {
            console.log(':: UI thread END ::');
            console.log('Result: ' + result);
            console.log('Duration: ' + stopwatch.stop().getDuration(true) + ' sec');
            console.log('---');
        });

    console.log(':: worker thread START ::');
    stopwatch.reset();
    stopwatch.start();
    receiveMulticoreWorker.computeCrazySineSum()
        .then(function (result) {
            console.log(':: worker thread END ::');
            console.log('Result: ' + result);
            console.log('Duration: ' + stopwatch.stop().getDuration(true) + ' sec');
            console.log('---');
        });
}

setTimeout(function () {
    document.write('TEST');
    setTimeout(run, 0);
}, 2000);
