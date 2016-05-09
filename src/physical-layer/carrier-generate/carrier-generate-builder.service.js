(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.CarrierGenerateBuilder', _CarrierGenerateBuilder);

    _CarrierGenerateBuilder.$inject = [
        'PhysicalLayer.CarrierGenerate'
    ];

    function _CarrierGenerateBuilder(
        CarrierGenerate
    ) {

        function build(samplePerPeriod) {
            return new CarrierGenerate(samplePerPeriod);
        }

        return {
            build: build
        };
    }

})();
