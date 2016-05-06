var DefaultConfig = (function () {
    'use strict';

    _DefaultConfig.$inject = [];

    function _DefaultConfig() {
        return {
            CHANNEL_1_FREQUENCY: 1070,
            CHANNEL_2_FREQUENCY: 2025,
            OFDM_SIZE: 1,
            OFDM_FREQUENCY_SPACING: 50,
            RX_INPUT: PhysicalLayerInput.MICROPHONE,
            RX_NOTIFICATION_PER_SECOND: 35,
            RX_DFT_WINDOW_TIME: 0.080,
            RX_SPECTRUM_FFT_SIZE: 1024,
            RX_HISTORY_POINT_SIZE: 35,
            BAUD: 4,
            FACTOR_INTERPACKET_GAP: 3,
            BAUD_MULTIPLICATIVE_INVERSE: 0.250,
            FACTOR_SYMBOL: 0.32,
            FACTOR_GUARD: 0.68,
            SYNC_DURATION: 3.0,
            SYMBOL_DURATION: 0.080,
            GUARD_INTERVAL: 0.170,
            INTERPACKET_GAP: 0.510,
            PSK_SIZE: 4,
            SYNC_PREAMBLE: true
        };
    }

    return new _DefaultConfig();        // TODO change it to dependency injection

})();
