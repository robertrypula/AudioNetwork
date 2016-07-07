// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Visualizer.FrequencyDomainChartTemplateMain', _FrequencyDomainChartTemplateMain);

    _FrequencyDomainChartTemplateMain.$inject = [];

    function _FrequencyDomainChartTemplateMain() {
        var html =
            '<div' +
            '    class="frequency-domain-chart-container"' +
            '    style="' +
            '        overflow: hidden;' +
            '        width: {{ width }}px;' +
            '        height: {{ height }}px;' +
            '        position: relative;' +
            '    "' +
            '    >' +
            '    <canvas ' +
            '        class="power-chart"' +
            '        style="' +
            '            width: {{ width }}px;' +
            '            height: {{ height }}px;' +
            '            position: absolute;' +
            '        "' +
            '        width="{{ width }}"' +
            '        height="{{ height }}"' +
            '        ></canvas>' +
            '</div>'
        ;

        return {
            html: html
        };
    }

})();
