// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
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
            return 0.3635819
                - 0.4891775 * MathUtil.cos(2 * MathUtil.PI * n / (N - 1))
                + 0.1365995 * MathUtil.cos(4 * MathUtil.PI * n / (N - 1))
                - 0.0106411 * MathUtil.cos(6 * MathUtil.PI * n / (N - 1));
        }

        return {
            blackmanNuttall: blackmanNuttall
        };
    }

})();
