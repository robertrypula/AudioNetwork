// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayerCore.ReceiveMulticoreWorkerThread', _ReceiveMulticoreWorkerThread);

    _ReceiveMulticoreWorkerThread.$inject = [];

    function _ReceiveMulticoreWorkerThread() {

        function getJavaScriptCode() {
            var i, js, scriptList;

            scriptList = [];
            for (i = 0; i < AudioNetwork.scriptList.length; i++) {
                scriptList.push('http://localhost:8000/src/' + AudioNetwork.scriptList[i]);
            }

            js = '';
            js += 'var AudioNetworkBlockAliasCreation = true;' + "\n";
            js += 'self.importScripts("' + scriptList.join('", "') + '");' + "\n";
            js += 'var MathUtil = AudioNetwork.Injector.resolve("Common.MathUtil");' + "\n";
            js += 'var ReceiveWorker = AudioNetwork.Injector.resolve("PhysicalLayerCore.ReceiveWorker");' + "\n";
            js += 'self.onmessage = function(event) { var result = 0; for (var i = 0; i < 2 * 9000111; i++) { result += MathUtil.sin(i); } postMessage(event.data + \' \' + result); }';

            return js;
        }

        return {
            getJavaScriptCode: getJavaScriptCode
        };
    }

})();
