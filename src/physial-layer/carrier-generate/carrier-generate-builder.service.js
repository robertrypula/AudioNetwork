var CarrierGenerateBuilder = (function () {
    'use strict';

    _CarrierGenerateBuilder.$inject = [];

    function _CarrierGenerateBuilder() {

        function build(samplePerPeriod) {
            return new CarrierGenerate(samplePerPeriod);
        }

        return {
            build: build
        };
    }

    return new _CarrierGenerateBuilder();        // TODO change it to dependency injection

})();
