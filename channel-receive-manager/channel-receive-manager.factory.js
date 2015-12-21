var ChannelReceiveManager = (function () {
    'use strict';

    _ChannelReceiveManager.$inject = [];

    function _ChannelReceiveManager() {
        var CRM;

        CRM = function (frequencyList) {
            this.channelReceive = [];
            this.gainNode;

            this.$$init();
            this.configure(frequencyList);
        };

        CRM.prototype.clear = function () {
            var i, cr;

            for (i = 0; i < this.channelReceive.length; i++) {
                cr = this.channelReceive[i];
                this.gainNode.disconnect(cr.getFirstNode());
                cr.destroy();
            }
            this.channelReceive.length = 0;
        };

        CRM.prototype.configure = function (frequencyList) {
            var i, cr;

            this.clear();
            for (i = 0; i < frequencyList.length; i++) {
                cr = ChannelReceiveBuilder.build(frequencyList[i]);
                this.gainNode.connect(cr.getFirstNode());
                this.channelReceive.push(cr);
            }
        };

        CRM.prototype.setSource = function (sourceNode) {
            sourceNode.connect(this.gainNode);
        };

        CRM.prototype.$$init = function () {
            this.gainNode = Audio.createGain();
        };

        CRM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.channelReceive.length) {
                throw 'Channel Index out of range: ' + channelIndex;
            }

            return this.channelReceive[channelIndex];
        };

        return CRM;
    }

    return _ChannelReceiveManager();        // TODO change it to dependency injection

})();
