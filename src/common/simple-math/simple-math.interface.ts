interface ISimpleMath {
  sin(x: number): number;
  cos(x: number): number;
  pow(x: number, exponent: number): number;
  sqrt(x: number): number;
  random(): number;
}

interface ISimpleMathStatic {
  new(): ISimpleMath;
}

export {
  ISimpleMath,
  ISimpleMathStatic
};
