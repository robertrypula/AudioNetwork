// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import {
  api,
  COMMON_MODULE,
  DSP_MODULE,
  injector,
  version
} from './index';

describe('index', () => {
  it('should give proper version', () => {
    expect(version).toBe('2.0.0-rc');
  });

  it('should lazy load CommonModule', () => {
    const moduleMock = {};

    spyOn(injector, 'get').and.returnValue(moduleMock);
    expect(api.commonModule).toBe(moduleMock);
    expect(injector.get).toHaveBeenCalledWith(COMMON_MODULE);
  });

  it('should lazy load DspModule', () => {
    const moduleMock = {};

    spyOn(injector, 'get').and.returnValue(moduleMock);
    expect(api.dspModule).toBe(moduleMock);
    expect(injector.get).toHaveBeenCalledWith(DSP_MODULE);
  });
});
