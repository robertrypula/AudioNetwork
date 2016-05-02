var SignalPowerCollectorBuilder = (function () {
    'use strict';

    _SignalPowerCollectorBuilder.$inject = [];

    function _SignalPowerCollectorBuilder() {

        function build() {
            return new SignalPowerCollector();
        }

        return {
            build: build
        };
    }

    return new _SignalPowerCollectorBuilder();        // TODO change it to dependency injection

})();
