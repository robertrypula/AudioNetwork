var AudioNetworkPhysicalLayer = (function () {
    'use strict';

    _AudioNetworkPhysicalLayer.$inject = [];

    function _AudioNetworkPhysicalLayer() {
        var ANPL;

        ANPL = function (configuration) {
            this.configuration = AudioNetworkPhysicalLayerConfiguration.parse(configuration);
            this.channelTransmitManager = null;

            this.$$initTx();
            this.$$initRx();
            this.channelTransmitManager.getOutputNode().connect(Audio.getDestination());
        };

        ANPL.prototype.$$initTx = function () {
            this.channelTransmitManager = ChannelTransmitManagerBuilder.build(
                this.configuration.tx.channel
            );
        };

        ANPL.prototype.$$initRx = function () {

        };

        ANPL.prototype.tx = function (channelIndex, data) {
            var
                channelTx = this.channelTransmitManager.getChannel(channelIndex),
                d, i, dataParsed = []
            ;

            if (!data) {
                throw 'Please specify data to send';
            }

            for (i = 0; i < data.length; i++) {
                d = data[i];
                dataParsed.push({
                    amplitude: d.amplitude || 1,
                    duration: Math.round(
                        Audio.getSampleRate() * (d.duration || 0.200)
                    ),
                    phase: d.phase || 0
                });
            }

            channelTx.addToQueue(dataParsed);
        };

        ANPL.prototype.getSampleRate = function () {
            return Audio.getSampleRate();
        };

        ANPL.prototype.destroy = function () {

        };

        return ANPL;
    }

    return _AudioNetworkPhysicalLayer();        // TODO change it to dependency injection

})();
