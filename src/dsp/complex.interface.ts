interface IComplex {
  clone(): IComplex;
  swap(): IComplex;
  conjugate(): IComplex;
  multiplyScalar(x: number): IComplex;
  divideScalar(x: number): IComplex;
  getReal(): number;
  getImaginary(): number;
  getMagnitude(): number;
  normalize(): IComplex;
}

interface IComplexStatic {
  new(real: number, imaginary: number): IComplex;
}

export {
  IComplex,
  IComplexStatic
};
