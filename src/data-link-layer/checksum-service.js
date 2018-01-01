// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

(function () {
    AudioNetwork.Injector
        .registerFactory('Rewrite.DataLinkLayer.ChecksumService', ChecksumService);

    ChecksumService.$inject = [];

    function ChecksumService() {
        var ChecksumService;

        ChecksumService = function () {
        };

        ChecksumService.fletcher8 = function (data) {
            var sum0, sum1, i, isLeftHalfOfByte, byteNumber, byte, halfOfByte;

            sum0 = 0;
            sum1 = 0;
            for (i = 0; i < 2 * data.length; i++) {
                isLeftHalfOfByte = i % 2 === 0;
                byteNumber = i >>> 1;
                byte = data[byteNumber];
                halfOfByte = isLeftHalfOfByte
                    ? (byte & 0xF0) >>> 4
                    : byte & 0x0F;
                sum0 = (sum0 + halfOfByte) % 0x0F;
                sum1 = (sum1 + sum0) % 0x0F;
            }

            return (sum1 << 4) | sum0;
        };

        return ChecksumService;
    }

})();
