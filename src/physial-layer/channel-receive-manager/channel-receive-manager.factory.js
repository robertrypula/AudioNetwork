var ChannelReceiveManager = (function () {
    'use strict';

    _ChannelReceiveManager.$inject = [];

    function _ChannelReceiveManager() {
        var CRM;

        CRM = function (configuration, bufferSize) {
            this.channelReceive = [];
            this.gainNode = null;
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;

            this.$$init();
            this.configure(configuration);
        };

        CRM.prototype.destroy = function () {
            this.$$clear();
        };

        CRM.prototype.$$clear = function () {
            var i, cr;

            for (i = 0; i < this.channelReceive.length; i++) {
                cr = this.channelReceive[i];
                this.gainNode.disconnect(cr.getFirstNode());
                cr.destroy();
            }
            this.channelReceive.length = 0;
        };

        CRM.prototype.configure = function (configuration) {
            var i, cr;

            this.$$clear();
            for (i = 0; i < configuration.length; i++) {
                cr = ChannelReceiveBuilder.build(i, configuration[i]);
                this.gainNode.connect(cr.getFirstNode());
                this.channelReceive.push(cr);
            }
        };

        CRM.prototype.getInputNode = function () {
            return this.gainNode;
        };

        CRM.prototype.$$init = function () {
            this.gainNode = Audio.createGain();
        };

        CRM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.channelReceive.length) {
                throw 'Channel index out of range: ' + channelIndex;
            }

            return this.channelReceive[channelIndex];
        };

        return CRM;
    }

    return _ChannelReceiveManager();        // TODO change it to dependency injection

})();
