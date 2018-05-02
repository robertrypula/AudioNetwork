// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { COMMON_MODULE } from './common/di-token';
import { LIST_FACTORY } from './common/list/di-token';
import { SIMPLE_MATH } from './common/simple-math/di-token';
import { PRECISION_DIGITS } from './di-token';
import { SIGNAL_FACTORY } from './dsp/signal/di-token';
import { COMPLEX_DEPENDENCY_BAG, COMPLEX_FACTORY } from './dsp/complex/di-token';
import { DSP_MODULE } from './dsp/di-token';
import { FOURIER_TRANSFORM } from './dsp/fourier-transform/di-token';

import { CommonModule } from './common/common-module';
import { ListFactory } from './common/list/list-factory';
import { SimpleMath } from './common/simple-math/simple-math';
import { SignalFactory } from './dsp/signal/signal-factory';
import { ComplexDependencyBag } from './dsp/complex/complex-dependency-bag';
import { ComplexFactory } from './dsp/complex/complex-factory';
import { DspModule } from './dsp/dsp-module';
import { FftDitRecursive } from './dsp/fourier-transform/fft-dit-recursive/fft-dit-recursive';
import { precisionDigits } from './settings';

const injector = new Injector();

injector.registerValue(PRECISION_DIGITS, precisionDigits);

injector.registerService(LIST_FACTORY, ListFactory);
injector.registerService(SIMPLE_MATH, SimpleMath);
injector.registerService(COMMON_MODULE, CommonModule);

injector.registerService(COMPLEX_DEPENDENCY_BAG, ComplexDependencyBag);
injector.registerService(COMPLEX_FACTORY, ComplexFactory);
injector.registerService(SIGNAL_FACTORY, SignalFactory);
injector.registerService(FOURIER_TRANSFORM, FftDitRecursive);
injector.registerService(DSP_MODULE, DspModule);

export default injector;
