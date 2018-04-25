// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import injector from './dependency-injection.config';

import * as Common from './common/index';
import * as Dsp from './dsp/index';

const api = {
  get dspModule(): Dsp.IDspModule {
    return injector.get(Dsp.DSP_MODULE);
  },
  get commonModule(): Common.ICommonModule {
    return injector.get(Common.COMMON_MODULE);
  }
};

export { version } from './version';
export {
  Common,
  Dsp,
  injector,
  api
};
