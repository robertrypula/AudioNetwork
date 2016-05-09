(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.QueueBuilder', _QueueBuilder);

    _QueueBuilder.$inject = [
        'Common.Queue'
    ];

    function _QueueBuilder(
        Queue
    ) {

        function build(size) {
            return new Queue(size);
        }

        return {
            build: build
        };
    }

})();
