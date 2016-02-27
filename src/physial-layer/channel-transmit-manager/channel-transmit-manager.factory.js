var ChannelTransmitManager = (function () {
    'use strict';

    _ChannelTransmitManager.$inject = [];

    function _ChannelTransmitManager() {
        var CTM;

        CTM = function (configuration) {
            this.channelTransmit = [];
            this.gainNode;

            this.$$init();
            this.$$configure(configuration);
        };

        CTM.prototype.destroy = function () {
            this.$$clear();
        };

        CTM.prototype.$$clear = function () {
            var i, ct;

            for (i = 0; i < this.channelTransmit.length; i++) {
                ct = this.channelTransmit[i];
                ct.getLastNode().disconnect(this.gainNode);
                ct.destroy();
            }
            this.channelTransmit.length = 0;
        };

        CTM.prototype.$$configure = function (configuration) {
            var i, ct;

            this.$$clear();
            for (i = 0; i < configuration.length; i++) {
                ct = ChannelTransmitBuilder.build(i, configuration[i]);
                ct.getLastNode().connect(this.gainNode);
                this.channelTransmit.push(ct);
            }
        };

        CTM.prototype.getOutputNode = function () {
            return this.gainNode;
        };

        CTM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.channelTransmit.length) {
                throw 'Channel Index out of range: ' + channelIndex;
            }

            return this.channelTransmit[channelIndex];
        };

        CTM.prototype.$$init = function () {
            this.gainNode = Audio.createGain();
        };

        return CTM;
    }

    return _ChannelTransmitManager();        // TODO change it to dependency injection

})();
