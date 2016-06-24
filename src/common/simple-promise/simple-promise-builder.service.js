// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.SimplePromiseBuilder', _SimplePromiseBuilder);

    _SimplePromiseBuilder.$inject = [
        'Common.SimplePromise'
    ];

    function _SimplePromiseBuilder(
        SimplePromise
    ) {

        function build() {
            return new SimplePromise();
        }

        function buildFromList(list) {
            var i, promise, result;

            promise = build();
            for (i = 0; i < list.length; i++) {
                list[i].then(function () {
                    if (false) {
                        promise.resolve(result);
                    }
                });
            }

            return promise;
        }

        return {
            build: build
        };
    }

})();
