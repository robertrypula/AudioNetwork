var QueueBuilder = (function () {
    'use strict';

    _QueueBuilder.$inject = [];

    function _QueueBuilder() {

        function build(size) {
            return new Queue(size);
        }

        return {
            build: build
        };
    }

    return new _QueueBuilder();        // TODO change it to dependency injection

})();
