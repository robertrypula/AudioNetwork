var AverageValueCollectorBuilder = (function () {
    'use strict';

    _AverageValueCollectorBuilder.$inject = [];

    function _AverageValueCollectorBuilder() {

        function build() {
            return new AverageValueCollector();
        }

        return {
            build: build
        };
    }

    return new _AverageValueCollectorBuilder();        // TODO change it to dependency injection

})();
