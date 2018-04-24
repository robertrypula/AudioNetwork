// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import injector from './dependency-injection.config';

import { COMMON_MODULE } from './common/di-token';
import { DSP_MODULE } from './dsp/di-token';

import CommonModule from './common/common-module';
import DspModule from './dsp/dsp-module';

const api = {
  get dspModule(): DspModule {
    return injector.get(DSP_MODULE);
  },
  get commonModule(): CommonModule {
    return injector.get(COMMON_MODULE);
  }
};

export { version } from './version';
export {
  injector,
  api
};
