interface IComplex {
  getReal(): number;
  getImaginary(): number;
}

interface IComplexStatic {
  new(real: number, imaginary: number): IComplex;
}

export {
  IComplex,
  IComplexStatic
};
