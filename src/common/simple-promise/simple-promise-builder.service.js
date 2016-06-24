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
            var i, promise, thenCount, catchCount;

            promise = build();
            thenCount = 0;
            catchCount = 0;
            for (i = 0; i < list.length; i++) {
                list[i]
                    .then(function () {
                        thenCount++;
                    })
                    .catch(function () {
                        catchCount++;
                    })
                    .finally(function () {
                        if (thenCount + catchCount === list.length) {
                            if (catchCount === 0) {
                                promise.resolve();
                            } else {
                                promise.reject();
                            }
                        }
                    });
            }

            return promise;
        }

        return {
            build: build,
            buildFromList: buildFromList
        };
    }

})();
