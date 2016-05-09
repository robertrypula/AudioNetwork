(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.DefaultConfig', _DefaultConfig);

    _DefaultConfig.$inject = [
        'PhysicalLayer.PhysicalLayerInput',
        'Common.MathUtil'
    ];

    function _DefaultConfig(
        PhysicalLayerInput,
        MathUtil
    ) {
        var
            baud = 4,
            baudMultiplicativeInverse = 1 / baud,
            factorSymbol = 0.32,
            factorGuard = 0.68,
            factorInterpacketGap = 5,
            symbolDuration = baudMultiplicativeInverse * factorSymbol,
            rxDftWindowTime = symbolDuration,
            guardInterval = baudMultiplicativeInverse * factorGuard,
            interpacketGap = guardInterval * factorInterpacketGap,
            ofdmFrequencySpacingPositiveInteger = 2,
            ofdmFrequencySpacing = ofdmFrequencySpacingPositiveInteger / symbolDuration,
            symbolFrequency = 1 / symbolDuration,
            symbolFrequencyFactor = 2,
            rxNotificationPerSecond = MathUtil.round(symbolFrequencyFactor * symbolFrequency),
            rxHistoryPointSize = rxNotificationPerSecond
        ;

        /*
            OFDM Frequency Spacing explanation [Wikipedia]:
                "The orthogonality requires that the sub-carrier spacing is k/TU Hertz, where TU seconds
                is the useful symbol duration (the receiver side window size), and k is a positive integer,
                typically equal to 1"

            Channel frequencies explanation [Wikipedia]:
                "In the Bell 103 system, the originating modem sends 0s by playing a 1,070 Hz tone,
                and 1s at 1,270 Hz, with the answering modem transmitting its 0s on 2,025 Hz and
                1s on 2,225 Hz. These frequencies were chosen carefully; they are in the range that
                suffers minimum distortion on the phone system and are not harmonics of each other."
        */

        return {
            CONSTELLATION_DIAGRAM_DECIBEL_LIMIT: 40,
            MINIMUM_POWER_DECIBEL: -99,
            FAKE_NOISE_MAX_AMPLITUDE: 0.001,
            CHANNEL_1_FREQUENCY: 1070,
            CHANNEL_2_FREQUENCY: 2025,
            OFDM_SIZE: 1,
            OFDM_FREQUENCY_SPACING_POSITIVE_INTEGER: ofdmFrequencySpacingPositiveInteger,
            OFDM_FREQUENCY_SPACING: ofdmFrequencySpacing,
            SYMBOL_FREQUENCY: symbolFrequency,
            SYMBOL_FREQUENCY_FACTOR: symbolFrequencyFactor,
            RX_INPUT: PhysicalLayerInput.MICROPHONE,
            RX_NOTIFICATION_PER_SECOND: rxNotificationPerSecond,
            RX_HISTORY_POINT_SIZE: rxHistoryPointSize,
            RX_DFT_WINDOW_TIME: rxDftWindowTime,
            RX_SPECTRUM_FFT_SIZE: 1024,
            BAUD: baud,
            BAUD_MULTIPLICATIVE_INVERSE: baudMultiplicativeInverse,
            FACTOR_SYMBOL: factorSymbol,
            FACTOR_GUARD: factorGuard,
            SYNC_DURATION: 3.0,
            SYMBOL_DURATION: symbolDuration,
            GUARD_INTERVAL: guardInterval,
            FACTOR_INTERPACKET_GAP: factorInterpacketGap,
            INTERPACKET_GAP: interpacketGap,
            PSK_SIZE: 4,
            SYNC_PREAMBLE: true
        };
    }

})();
