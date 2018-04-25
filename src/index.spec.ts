// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import * as index from './index';

describe('index', () => {
  it('should give proper version', () => {
    expect(index.version).toBe('2.0.0-rc');
  });
});
