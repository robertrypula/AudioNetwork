// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import CommonModule from './common/common-module';
import { COMMON_MODULE } from './common/di-token';
import injector from './di';
import { DSP_MODULE } from './dsp/di-token';
import DspModule from './dsp/dsp-module';

const getDspModule = (): DspModule => {
  return injector.get(DSP_MODULE);
};

const getCommonModule = (): CommonModule => {
  return injector.get(COMMON_MODULE);
};

export { version } from './version';
export {
  injector,
  getDspModule,
  getCommonModule
};
