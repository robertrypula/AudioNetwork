// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

var
    physicalLayerBuilder,
    physicalLayer;

function init() {
    physicalLayerBuilder = new PhysicalLayerV2Builder();
    physicalLayer = physicalLayerBuilder
        .build();

    onLoopbackCheckboxChange();
}

function onLoopbackCheckboxChange() {
    physicalLayer.setLoopback(
        document.getElementById('loopback-checkbox').checked
    );
}
