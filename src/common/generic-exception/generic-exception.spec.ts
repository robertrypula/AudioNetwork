// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import GenericException from './generic-exception';

describe('GenericException', () => {
  let genericException: GenericException;

  it('should create proper instance', () => {
    genericException = new GenericException();

    expect(genericException).toBeInstanceOf(GenericException);
  });

  it('should store custom message and value', () => {
    const MESSAGE = 'test';
    const VALUE = 123;

    genericException = new GenericException(MESSAGE, VALUE);

    expect(genericException).toBeInstanceOf(GenericException);
    expect(genericException.getMessage()).toBe(MESSAGE);
    expect(genericException.getValue()).toBe(VALUE);

    expect(genericException + '').toBe(MESSAGE + ' - ' + VALUE);
  });
});
