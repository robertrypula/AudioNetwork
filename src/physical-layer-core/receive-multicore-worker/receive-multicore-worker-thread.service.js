// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerCore.ReceiveMulticoreWorkerThread', _ReceiveMulticoreWorkerThread);

    _ReceiveMulticoreWorkerThread.$inject = [];

    function _ReceiveMulticoreWorkerThread() {

        function $$getFormattedDevScriptList() {
            var i, src, isLast, scriptList = [];

            for (i = 0; i < AudioNetwork.devScriptList.length; i++) {
                src = AudioNetwork.bootConfig.devScriptBaseUrl + AudioNetwork.devScriptList[i];
                isLast = i === AudioNetwork.devScriptList.length - 1;
                scriptList.push('    \'' + src + '\'' + (isLast ? '' : ',') + '\n');
            }

            return scriptList;
        }

        function $$getFormattedProdScriptList() {
            var src, scriptList = [];

            src = AudioNetwork.bootConfig.prodScriptBaseUrl + AudioNetwork.bootConfig.prodScriptName;
            scriptList.push('    \'' + src + '\'' + '\n');

            return scriptList;
        }

        function getJavaScriptCode() {
            var js = '', scriptList;

            switch (AudioNetwork.bootConfig.multicoreState) {
                case AudioNetwork.MULTICORE_STATE.ENABLED_USE_DEV_SCRIPT:
                    scriptList = $$getFormattedDevScriptList();
                    break;
                case AudioNetwork.MULTICORE_STATE.ENABLED_USE_PROD_SCRIPT:
                    scriptList = $$getFormattedProdScriptList();
                    break;
            }

            js += 'self.importScripts(                                                                         ' + '\n';
            js += scriptList.join('');
            js += ');                                                                                          ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'var                                                                                         ' + '\n';
            js += '    iAlias = AudioNetwork.Injector,                                                         ' + '\n';
            js += '    AbstractWorker = iAlias.resolve("Common.AbstractWorker"),                               ' + '\n';
            js += '    ReceiveWorker = iAlias.resolve("PhysicalLayerCore.ReceiveWorker"),                      ' + '\n';
            js += '    ReceiveMulticoreWorker = iAlias.resolve("PhysicalLayerCore.ReceiveMulticoreWorker"),    ' + '\n';
            js += '    receiveWorker = undefined;                                                              ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '// eval("console.log(\'eval inside thread test\');")                                        ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'self.onmessage = function(event) {                                                          ' + '\n';
            js += '    var                                                                                     ' + '\n';
            js += '        data = event.data,                                                                  ' + '\n';
            js += '        messageIndex = data.length > 0 ? data[0] : null,                                    ' + '\n';
            js += '        param = data.length > 0 ? data[1] : null,                                           ' + '\n';
            js += '        promise;                                                                            ' + '\n';
            js += '      console.log("thread", messageIndex);                                                                                      ' + '\n';
            js += '    switch (messageIndex) {                                                                 ' + '\n';
            js += '        case AbstractWorker.INITIALIZATION:                                                 ' + '\n';
            js += '            receiveWorker = new ReceiveWorker(param);                                       ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                AbstractWorker.INITIALIZATION_SUCCESS                                       ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '        case ReceiveMulticoreWorker.HANDLE_SAMPLE_BLOCK:                                    ' + '\n';
            js += '            promise = receiveWorker.handleSampleBlock(param);                               ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '        case ReceiveMulticoreWorker.COMPUTE_CRAZY_SINE_SUM:                                 ' + '\n';
            js += '            promise = receiveWorker.computeCrazySineSum(param);                             ' + '\n';
            js += '            break;                                                                          ' + '\n';
            js += '    }                                                                                       ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '    if (!promise) {                                                                         ' + '\n';
            js += '        return;                                                                             ' + '\n';
            js += '    }                                                                                       ' + '\n';
            js += '                                                                                            ' + '\n';
            js += '    promise                                                                                 ' + '\n';
            js += '        .then(function (result) {                                                           ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                messageIndex + AbstractWorker.MESSAGE_INDEX_OFFSET_SUCCESS,                 ' + '\n';
            js += '                result                                                                      ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '        })                                                                                  ' + '\n';
            js += '        .catch(function () {                                                                ' + '\n';
            js += '            self.postMessage([                                                              ' + '\n';
            js += '                messageIndex + AbstractWorker.MESSAGE_INDEX_OFFSET_FAIL,                    ' + '\n';
            js += '                result                                                                      ' + '\n';
            js += '            ]);                                                                             ' + '\n';
            js += '        });                                                                                 ' + '\n';
            js += '}                                                                                           ' + '\n';
            js += '                                                                                            ' + '\n';

            return js;
        }

        return {
            getJavaScriptCode: getJavaScriptCode
        };
    }

})();
