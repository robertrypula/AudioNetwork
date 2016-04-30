var PhaseOffsetCollectorBuilder = (function () {
    'use strict';

    _PhaseOffsetCollectorBuilder.$inject = [];

    function _PhaseOffsetCollectorBuilder() {

        function build() {
            return new PhaseOffsetCollector();
        }

        return {
            build: build
        };
    }

    return new _PhaseOffsetCollectorBuilder();        // TODO change it to dependency injection

})();
