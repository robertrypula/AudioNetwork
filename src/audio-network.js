'use strict';

// AudioNetrowk namespace - this is the only variable that is visible to the global JavaScript scope
var AudioNetwork = {};

AudioNetwork.Injector = (function () {
    var Injector;

    Injector = function () {
        this.item = [];
    };

    Injector.prototype.registerService = function (name, factory) {
        console.log(name, factory.$inject, factory());
    };

    Injector.prototype.registerFactory = function (name, factory) {
        console.log(name, factory.$inject, factory());
    };

    Injector.prototype.get = function () {
        return '';
    };

    return new Injector();
})();


// aliases
AudioNetwork.PhysicalLayer = AudioNetwork.Injector.get('PhysicalLayer.PhysicalLayer');
AudioNetwork.factory = AudioNetwork.Injector.registerFactory;
AudioNetwork.service = AudioNetwork.Injector.registerService;


// TODO injector tests - delete later
(function () {
    'use strict';

    _MyClassOne.$inject = [];

    function _MyClassOne() {
        var MyClassOne;

        MyClassOne = function () {
            this.$$someVariable = 'test';
        };

        MyClassOne.prototype.getSomeVariable = function () {
            return this.$$someVariable;
        };

        return MyClassOne;
    }

    AudioNetwork.factory('MyClassOne', _MyClassOne);

})();

(function () {
    'use strict';

    _MyOtherClass.$inject = [
        'MyClassOne'
    ];

    function _MyOtherClass(MyClassOne) {
        var MyOtherClass;

        MyOtherClass = function () {
            this.$$someVariable = 'other test';
            this.myClassOne = new MyClassOne();
        };

        MyOtherClass.prototype.getSomeVariable = function () {
            return this.$$someVariable;
        };

        return MyOtherClass;
    }

    AudioNetwork.factory('MyOtherClass', _MyOtherClass);

})();
