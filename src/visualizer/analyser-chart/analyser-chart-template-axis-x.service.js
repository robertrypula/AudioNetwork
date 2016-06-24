// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.AnalyserChartTemplateAxisX', _AnalyserChartTemplateAxisX);

    _AnalyserChartTemplateAxisX.$inject = [];

    function _AnalyserChartTemplateAxisX() {
        var html =
            '<span' +
            '    style="' +
            '        display: block;' +
            '        box-sizing: border-box;' +
            '        border-left: 1px solid {{ colorAxis }};' +
            '        position: absolute;' +
            '        width: {{ width }}px;' +
            '        top: 0px;' +
            '        left: {{ left }}px;' +
            '        "' +
            '    >' +
            '    {{ label }}' +
            '</span>'
        ;

        return {
            html: html
        };
    }

})();
