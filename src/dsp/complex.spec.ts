import Complex from './complex';

describe('Complex', () => {
  it('should create proper instance', () => {
    const complex = new Complex(1, 2);

    expect(complex).toBeInstanceOf(Complex);
  });

  it('should return real and immaginary part', () => {
    const complex = new Complex(1, 2);

    expect(complex.getReal()).toBe(1);
    expect(complex.getImaginary()).toBe(2);
  });
});
