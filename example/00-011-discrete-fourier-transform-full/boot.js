// Copyright (c) 2015-2017 Robert Rypuła - https://audio-network.rypula.pl
'use strict';

function startApp() {
    separateSineInitialize();
    separateSineUpdate();

    summedSineInitialize();
    summedSineUpdate();

    timeDomainRawInitialize();
    timeDomainRawUpdate();

    windowFunctionInitialize();
    windowFunctionUpdate();

    timeDomainProcessedInitialize();
    timeDomainProcessedUpdate();

    discreteFourierTransformInitialize();
    discreteFourierTransformUpdate();

    constellationDiagramInitialize();
    constellationDiagramUpdate();

    frequencyBinExplanationInitialize();
    frequencyBinExplanationUpdate();

    dataBindingCodeToTemplate();
}
