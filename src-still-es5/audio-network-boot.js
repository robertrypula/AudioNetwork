// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

// TODO extract only important parts of this file - it will no longer be need when after introducing  WebPack/TypeScript

var
    AudioNetwork = {},                                        // namespace visible to the global JavaScript scope
    AudioNetworkBootConfig = AudioNetworkBootConfig || {};    // injects boot config

AudioNetwork.version = '1.3.0';

// conditions from: http://stackoverflow.com/a/33697246
AudioNetwork.isNode = typeof module !== 'undefined' && module.exports ? true : false;
AudioNetwork.isWebWorker = !AudioNetwork.isNode && typeof WorkerGlobalScope !== 'undefined' && typeof importScripts == 'function' && navigator instanceof WorkerNavigator;
AudioNetwork.isBrowser = !AudioNetwork.isNode && !AudioNetwork.isWebWorker && typeof navigator !== 'undefined' && typeof document !== 'undefined';

/*
console.log(AudioNetwork.isNode);
console.log(AudioNetwork.isWebWorker);
console.log(AudioNetwork.isBrowser);
*/

AudioNetwork.MULTICORE_STATE = {
    DISABLED: 'DISABLED',
    ENABLED_USE_PROD_SCRIPT: 'ENABLED_USE_PROD_SCRIPT',
    ENABLED_USE_DEV_SCRIPT: 'ENABLED_USE_DEV_SCRIPT'
};

AudioNetwork.bootConfig = {
    devScriptBaseUrl: typeof AudioNetworkBootConfig.devScriptBaseUrl === 'string'
        ? AudioNetworkBootConfig.devScriptBaseUrl
        : (AudioNetwork.isBrowser ? window.location.origin + '/src/' : ''),
    prodScriptBaseUrl: typeof AudioNetworkBootConfig.prodScriptBaseUrl === 'string'
        ? AudioNetworkBootConfig.prodScriptBaseUrl
        : (AudioNetwork.isBrowser ? window.location.origin + '/build/' : ''),
    prodScriptName: typeof AudioNetworkBootConfig.prodScriptName === 'string'
        ? AudioNetworkBootConfig.prodScriptName
        : 'audio-network-v' + AudioNetwork.version + '.min.js',
    devScriptLoad: typeof AudioNetworkBootConfig.devScriptLoad !== 'undefined'
        ? !!AudioNetworkBootConfig.devScriptLoad
        : false,
    createAlias: typeof AudioNetworkBootConfig.createAlias !== 'undefined'
        ? !!AudioNetworkBootConfig.createAlias
        : true,
    multicoreState: Object.keys(AudioNetwork.MULTICORE_STATE).indexOf(AudioNetworkBootConfig.multicoreState) !== -1
        ? AudioNetworkBootConfig.multicoreState
        : AudioNetwork.MULTICORE_STATE.DISABLED
};
