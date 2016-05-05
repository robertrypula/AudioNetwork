'use strict';

// AudioNetwork namespace - this is the only variable that is visible to the global JavaScript scope
var AudioNetwork = {};

AudioNetwork.Injector = (function () {
    var Injector;

    Injector = function () {
        this.$$injectRepository = {};
    };

    Injector.MULTIPLE_REGISTER_EXCEPTION = 'Injector - multiple register calls for the same name';
    Injector.UNABLE_TO_FIND_ITEM_EXCEPTION = 'Injector - unable to find factory/service for given name';
    Injector.TYPE = {
        SERVICE: 'SERVICE',
        FACTORY: 'FACTORY'
    };

    Injector.prototype.$$register = function (name, item, type) {
        if (typeof this.$$injectRepository[name] === 'undefined') {
            this.$$injectRepository[name] = {
                type: type,
                item: item,
                resolveCache: null
            };
        } else {
            throw Injector.MULTIPLE_REGISTER_EXCEPTION;
        }
    };

    Injector.prototype.registerService = function (name, service) {
        this.$$register(name, service, Injector.TYPE.SERVICE);
    };

    Injector.prototype.registerFactory = function (name, factory) {
        this.$$register(name, factory, Injector.TYPE.FACTORY);
    };

    Injector.prototype.resolve = function (name) {
        var i, findResult, injectList = [];

        findResult = this.$$find(name);
        if (findResult.resolveCache) {
            return findResult.resolveCache;
        }

        for (i = 0; i < findResult.item.$inject.length; i++) {
            injectList.push(
              this.resolve(findResult.item.$inject[i])
            );
        }

        switch (findResult.type) {
            case Injector.TYPE.SERVICE:
                findResult.resolveCache = this.$$injectDependenciesAndInstantiate(findResult, injectList);
                break;
            case Injector.TYPE.FACTORY:
                findResult.resolveCache = this.$$injectDependencies(findResult, injectList);
                break;
        }

        return findResult.resolveCache;
    };

    Injector.prototype.$$injectDependenciesAndInstantiate = function (findResult, injectList) {
        var
            f = findResult,
            i = injectList,
            r
        ;

        switch (injectList.length) {
            case 0: r = new f.item(); break;
            case 1: r = new f.item(i[0]); break;
            case 2: r = new f.item(i[0], i[1]); break;
            case 3: r = new f.item(i[0], i[1], i[2]); break;
            case 4: r = new f.item(i[0], i[1], i[2], i[3]); break;
            case 5: r = new f.item(i[0], i[1], i[2], i[3], i[4]); break;
            case 6: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5]); break;
            case 7: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6]); break;
            case 8: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7]); break;
            case 9: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8]); break;
            case 10: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9]); break;
            case 11: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10]); break;
            case 12: r = new f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11]); break;
        }

        return r;
    };

    Injector.prototype.$$injectDependencies = function (findResult, injectList) {
        var
            f = findResult,
            i = injectList,
            r
        ;

        switch (injectList.length) {
            case 0: r = f.item(); break;
            case 1: r = f.item(i[0]); break;
            case 2: r = f.item(i[0], i[1]); break;
            case 3: r = f.item(i[0], i[1], i[2]); break;
            case 4: r = f.item(i[0], i[1], i[2], i[3]); break;
            case 5: r = f.item(i[0], i[1], i[2], i[3], i[4]); break;
            case 6: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5]); break;
            case 7: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6]); break;
            case 8: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7]); break;
            case 9: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8]); break;
            case 10: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9]); break;
            case 11: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10]); break;
            case 12: r = f.item(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11]); break;
        }

        return r;
    };

    Injector.prototype.$$find = function (name) {
        var key;

        for (key in this.$$injectRepository) {
            if (this.$$injectRepository.hasOwnProperty(key) && key === name) {
                return this.$$injectRepository[key];
            }
        }
        throw Injector.UNABLE_TO_FIND_ITEM_EXCEPTION;
    };

    return new Injector();
})();


// aliases
// AudioNetwork.PhysicalLayer = AudioNetwork.Injector.resolve('PhysicalLayer.PhysicalLayer');
// AudioNetwork.factory = AudioNetwork.Injector.registerFactory;
// AudioNetwork.service = AudioNetwork.Injector.registerService;


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

    // AudioNetwork.factory('MyClassOne', _MyClassOne);
    AudioNetwork.Injector.registerFactory('MyClassOne', _MyClassOne);

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

        MyOtherClass.prototype.getMyClassOneSomeVariable = function () {
            return this.myClassOne.getSomeVariable();
        };

        return MyOtherClass;
    }

    // AudioNetwork.factory('MyOtherClass', _MyOtherClass);
    AudioNetwork.Injector.registerFactory('MyOtherClass', _MyOtherClass);

})();

(function () {
    'use strict';

    _ClassBuilder.$inject = [
        'MyClassOne'
    ];

    function _ClassBuilder(MyClassOne) {
        /*
         var ClassBuilder = function () {
         };

         ClassBuilder.prototype.build = function () {
         return new MyClassOne();
         };

         return ClassBuilder;
         */

        function build() {
            return new MyClassOne();
        }

        return {
            build: build
        };
    }

    AudioNetwork.Injector.registerService('ClassBuilder', _ClassBuilder);

})();


console.log('----');
// console.log(typeof AudioNetwork.Injector.resolve('MyOtherClass').item());

var MyOtherClass = AudioNetwork.Injector.resolve('MyOtherClass');
var ClassBuilder = AudioNetwork.Injector.resolve('ClassBuilder');
var myOtherClass = new MyOtherClass();

console.log(MyOtherClass);
console.log(typeof MyOtherClass);

console.log(ClassBuilder);
console.log(typeof ClassBuilder);

console.log(myOtherClass);
console.log(typeof myOtherClass);

//var myOtherClass = new MyOtherClass();

//console.log(MyOtherClass);
//console.log(myOtherClass);
//console.log(myOtherClass.getMyClassOneSomeVariable());