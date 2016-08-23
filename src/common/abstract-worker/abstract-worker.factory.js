// Copyright (c) 2015-2016 Robert Rypuła - https://audio-network.rypula.pl
(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('Common.AbstractWorker', _AbstractWorker);

    _AbstractWorker.$inject = [
        'Common.SimplePromiseBuilder'
    ];

    function _AbstractWorker(
        SimplePromiseBuilder
    ) {
        var AbstractWorker;

        AbstractWorker = function (key) {
            var objectUrl;

            this.$$key = key;
            this.$$promise = [];

            objectUrl = URL.createObjectURL(
                new Blob(
                    [ this.$$getJavaScriptCode() ],
                    { type: 'application/javascript' }
                )
            );

            this.$$worker = new Worker(objectUrl);
            this.$$worker.onmessage = this.$$onMessage.bind(this);
        };

        AbstractWorker.MULTICORE_SUPPORT_IS_NOT_ENABLED_EXCEPTION = 'Multicore support is not enabled';
        AbstractWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION = 'Previous promise not resolved yet';
        AbstractWorker.ABSTRACT_METHOD_CALLED_EXCEPTION = 'Abstract method called';

        AbstractWorker.MESSAGE_INDEX_SPACING = 3;
        AbstractWorker.MESSAGE_INDEX_OFFSET_SUCCESS = 1;
        AbstractWorker.MESSAGE_INDEX_OFFSET_FAIL = 2;

        AbstractWorker.INITIALIZATION = 0;
        AbstractWorker.INITIALIZATION_SUCCESS = 1;
        AbstractWorker.INITIALIZATION_FAIL = 2;
        // add more messages in derived class with indexes 3, 4, 5, ...

        AbstractWorker.prototype.destroy = function() {
            if (this.$$worker) {
                this.$$worker.terminate();
                this.$$worker = undefined;
            }
        };

        AbstractWorker.prototype.getInitialization = function() {
            return this.$$promise[AbstractWorker.INITIALIZATION];
        };

        AbstractWorker.prototype.$$getJavaScriptCode = function() {
            throw AbstractWorker.ABSTRACT_METHOD_CALLED_EXCEPTION;
        };

        AbstractWorker.prototype.$$onMessage = function(event) {
            var
                data = event.data,
                messageIndex = data.length > 0 ? data[0] : null,
                result = data.length > 1 ? data[1] : null,
                promise,
                i;

            for (i = 0; i < this.$$promise.length; i++) {
                promise = this.$$promise[i];
                if (promise) {
                    switch (messageIndex % AbstractWorker.MESSAGE_INDEX_SPACING) {
                        case AbstractWorker.MESSAGE_INDEX_OFFSET_SUCCESS:
                            promise.resolve(result);
                            break;
                        case AbstractWorker.MESSAGE_INDEX_OFFSET_FAIL:
                            promise.reject(result);
                            break;
                    }
                    this.$$promise[i] = undefined;
                    break;
                }
            }
        };

        AbstractWorker.prototype.$$getTransferList = function (value) {
            return (value && value.buffer instanceof ArrayBuffer) ? [value.buffer] : [];
        };

        AbstractWorker.prototype.$$sendToThread = function (messageIndex, value, transfer) {
            if (this.$$promise[messageIndex]) {
                throw ReceiveWorker.PREVIOUS_PROMISE_NOT_RESOLVED_YET_EXCEPTION;
            }
            this.$$promise[messageIndex] = SimplePromiseBuilder.build();

            this.$$worker.postMessage(
                [
                    messageIndex,
                    value
                ],
                transfer ? this.$$getTransferList(value) : []
            );

            return this.$$promise[messageIndex];
        };

        return AbstractWorker;
    }

})();
