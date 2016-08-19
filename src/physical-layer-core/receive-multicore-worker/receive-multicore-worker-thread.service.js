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
            var i, js = '', scriptList;

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
            js += 'var MathUtil = AudioNetwork.Injector.resolve("Common.MathUtil");                            ' + '\n';
            js += 'var ReceiveWorker = AudioNetwork.Injector.resolve("PhysicalLayerCore.ReceiveWorker");       ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'eval("console.log(\'eval inside thread test\');")                                           ' + '\n';
            js += '                                                                                            ' + '\n';
            js += 'self.onmessage = function(event) {                                                          ' + '\n';
            js += '    var result = 0;                                                                         ' + '\n';
            js += '    for (var i = 0; i < 2 * 9000111; i++) {                                                 ' + '\n';
            js += '        result += MathUtil.sin(i);                                                          ' + '\n';
            js += '    }                                                                                       ' + '\n';
            js += '    postMessage(event.data + \' \' + result);                                               ' + '\n';
            js += '}                                                                                           ' + '\n';
            js += 'postMessage(\'ready\');                                                                     ' + '\n';
            js += '                                                                                            ' + '\n';

            return js;
        }

        return {
            getJavaScriptCode: getJavaScriptCode
        };
    }

})();
