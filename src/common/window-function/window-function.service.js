// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.WindowFunction', _WindowFunction);

    _WindowFunction.$inject = [
        'Common.MathUtil'
    ];

    function _WindowFunction(
        MathUtil
    ) {

        function blackmanNuttall(n, N) {
            var
                a0 = 0.3635819,
                a1 = 0.4891775,
                a2 = 0.1365995,
                a3 = 0.0106411,
                result;

            result = a0
                - a1 * MathUtil.cos(2 * MathUtil.PI * n / (N - 1))
                + a2 * MathUtil.cos(4 * MathUtil.PI * n / (N - 1))
                - a3 * MathUtil.cos(6 * MathUtil.PI * n / (N - 1));

            return result;
        }

        return {
            blackmanNuttall: blackmanNuttall
        };
    }

})();
