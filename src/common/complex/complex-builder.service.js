// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('Common.ComplexBuilder', _ComplexBuilder);

    _ComplexBuilder.$inject = [
        'Common.Complex'
    ];

    function _ComplexBuilder(
        Complex
    ) {

        function build(real, imm) {
            return new Complex(real, imm);
        }

        function copy(complex) {
            return new Complex(complex.real, complex.imm);
        }

        return {
            build: build,
            copy: copy
        };
    }

})();
