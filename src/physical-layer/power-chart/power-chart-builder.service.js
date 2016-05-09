(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.PowerChartBuilder', _PowerChartBuilder);

    _PowerChartBuilder.$inject = [
        'PhysicalLayer.PowerChart'
    ];

    function _PowerChartBuilder(
        PowerChart
    ) {

        function build(parentElement, width, height) {
            return new PowerChart(parentElement, width, height);
        }

        return {
            build: build
        };
    }

})();
