// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import CommonModule from './common/common-module';
import { COMMON_MODULE } from './common/di-token';
import { SIMPLE_MATH } from './common/simple-math/di-token';
import SimpleMath from './common/simple-math/simple-math';
import ComplexFactory from './dsp/complex/complex-factory';
import { COMPLEX_FACTORY } from './dsp/complex/di-token';
import { DSP_MODULE } from './dsp/di-token';
import DspModule from './dsp/dsp-module';
import { FFT } from './dsp/fft/di-token';
import Fft from './dsp/fft/fft';

const injector = new Injector();

injector.registerService(SIMPLE_MATH, SimpleMath);
injector.registerService(COMMON_MODULE, CommonModule);

injector.registerService(COMPLEX_FACTORY, ComplexFactory);
injector.registerService(FFT, Fft);
injector.registerService(DSP_MODULE, DspModule);

export default injector;
