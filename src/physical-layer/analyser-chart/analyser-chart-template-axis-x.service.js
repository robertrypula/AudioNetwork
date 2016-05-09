(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.AnalyserChartTemplateAxisX', _AnalyserChartTemplateAxisX);

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
