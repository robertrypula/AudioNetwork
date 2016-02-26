var AudioNetworkPhysicalLayer = (function () {
    'use strict';

    _AudioNetworkPhysicalLayer.$inject = [];

    function _AudioNetworkPhysicalLayer() {
        var ANPL;

        ANPL = function () {
            console.log('AudioNetworkPhysicalLayer constuctor');
        };

        ANPL.prototype.test = function () {
            console.log('AudioNetworkPhysicalLayer test');
        };

        ANPL.prototype.destroy = function () {

        };

        return ANPL;
    }

    return _AudioNetworkPhysicalLayer();        // TODO change it to dependency injection

})();
