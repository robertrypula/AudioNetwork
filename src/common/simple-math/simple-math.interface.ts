// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

interface ISimpleMath {
  getPi(): number;
  sin(x: number): number;
  cos(x: number): number;
  asin(x: number): number;
  pow(x: number, exponent: number): number;
  sqrt(x: number): number;
  random(): number;
  max(a: number, b: number): number;
  min(a: number, b: number): number;
}

interface ISimpleMathStatic {
  new(): ISimpleMath;
}

export {
  ISimpleMath,
  ISimpleMathStatic
};
