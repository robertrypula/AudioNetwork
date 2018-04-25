// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import injector from './dependency-injection.config';

import { COMMON_MODULE } from './common/di-token';
import { DSP_MODULE } from './dsp/di-token';

import { ICommonModule } from './common/common.interface';
import { IDspModule } from './dsp/dsp-module.interface';

const api = {
  get dspModule(): IDspModule {
    return injector.get(DSP_MODULE);
  },
  get commonModule(): ICommonModule {
    return injector.get(COMMON_MODULE);
  }
};

export { version } from './version';
export {
  injector,
  api
};
