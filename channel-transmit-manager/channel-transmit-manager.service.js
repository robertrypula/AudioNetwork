var ChannelTransmitManager = (function () {
    'use strict';

    _ChannelTransmitManager.$inject = [];

    function _ChannelTransmitManager() {
        var
            channelTransmit = [],
            gainNode;


        function clear() {
            var i, ct;

            for (i = 0; channelTransmit.length; i++) {
                ct = channelTransmit[i];
                ct.getLastNode().disconnect(gainNode);
                ct.destroy();
            }
            channelTransmit.length = 0;
        }

        function create(frequencyList) {
            var i, ct;

            clear();
            for (i = 0; i < frequencyList.length; i++) {
                ct = ChannelTransmitBuilder.build(frequencyList[i]);
                ct.getLastNode().connect(gainNode);
                channelTransmit.push(ct);
            }
        }

        function getGainNode() {
            return gainNode;
        }

        function getChannel(channelIndex) {
            if (channelIndex < 0 || channelIndex >= channelTransmit.length) {
                throw 'Channel Index out of range: ' + channelIndex;
            }

            return channelTransmit[channelIndex];
        }

        function init() {
            gainNode = Audio.createGain();
        }

        init();

        return {
            create: create,
            clear: clear,
            getGainNode: getGainNode,
            getChannel: getChannel
        };
    }

    return new _ChannelTransmitManager();        // TODO change it to dependency injection

})();
