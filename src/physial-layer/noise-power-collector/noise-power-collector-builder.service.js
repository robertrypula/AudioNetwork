var NoisePowerCollectorBuilder = (function () {
    'use strict';

    _NoisePowerCollectorBuilder.$inject = [];

    function _NoisePowerCollectorBuilder() {

        function build() {
            return new NoisePowerCollector();
        }

        return {
            build: build
        };
    }

    return new _NoisePowerCollectorBuilder();        // TODO change it to dependency injection

})();
