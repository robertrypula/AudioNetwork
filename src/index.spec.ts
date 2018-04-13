// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { version } from './index';

describe('index', () => {
  it('should give proper version', () => {
    expect(version).toBe('2.0.0-rc');
  });
});
