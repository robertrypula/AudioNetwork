// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import CommonModule from './common/common-module';
import { COMMON_MODULE } from './common/di-token';
import { LIST_FACTORY } from './common/list/di-token';
import ListFactory from './common/list/list-factory';
import { SIMPLE_MATH } from './common/simple-math/di-token';
import SimpleMath from './common/simple-math/simple-math';
import ComplexListUtil from './dsp/complex-list-util/complex-list-util';
import { COMPLEX_LIST_UTIL } from './dsp/complex-list-util/di-token';
import ComplexFactory from './dsp/complex/complex-factory';
import { COMPLEX_FACTORY } from './dsp/complex/di-token';
import { DSP_MODULE } from './dsp/di-token';
import DspModule from './dsp/dsp-module';
import { FOURIER_TRANSFORM } from './dsp/fourier-transform/di-token';
import Fft from './dsp/fourier-transform/fft/fft';

const injector = new Injector();

injector.registerService(LIST_FACTORY, ListFactory);
injector.registerService(SIMPLE_MATH, SimpleMath);
injector.registerService(COMMON_MODULE, CommonModule);

injector.registerService(COMPLEX_FACTORY, ComplexFactory);
injector.registerService(COMPLEX_LIST_UTIL, ComplexListUtil);
injector.registerService(FOURIER_TRANSFORM, Fft);
injector.registerService(DSP_MODULE, DspModule);

export default injector;
