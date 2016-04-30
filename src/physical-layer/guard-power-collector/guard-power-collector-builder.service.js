var GuardPowerCollectorBuilder = (function () {
    'use strict';

    _GuardPowerCollectorBuilder.$inject = [];

    function _GuardPowerCollectorBuilder() {

        function build() {
            return new GuardPowerCollector();
        }

        return {
            build: build
        };
    }

    return new _GuardPowerCollectorBuilder();        // TODO change it to dependency injection

})();
