// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var Socket = (function () {
    var Socket;

    Socket = function () { // <-- TODO this will be soon refactored when code will be moved to the main NPM package
        this.$$state = Socket.CLOSED;
    };

    Socket.CLOSED = 'CLOSED';
    Socket.LISTEN = 'LISTEN';
    Socket.SYN_SENT = 'C_SYN_SENT';
    Socket.SYN_RECEIVED = 'SYN_RECEIVED';
    Socket.ESTABLISHED = 'ESTABLISHED';

    return Socket;
})();
