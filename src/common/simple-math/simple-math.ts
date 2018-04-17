// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { ISimpleMath, ISimpleMathStatic } from './simple-math.interface';

@staticImplements<ISimpleMathStatic>()
class SimpleMath implements ISimpleMath {
  public getPi(): number {
    return Math.PI;
  }

  public sin(x: number): number {
    return Math.sin(x);
  }

  public cos(x: number): number {
    return Math.cos(x);
  }

  public asin(x: number): number {
    return Math.asin(x);
  }

  public pow(x: number, exponent: number): number {
    return Math.pow(x, exponent);
  }

  public sqrt(x: number): number {
    return Math.sqrt(x);
  }

  public random(): number {
    return Math.random();
  }

  public max(a: number, b: number): number {
    return Math.max(a, b);
  }

  public min(a: number, b: number): number {
    return Math.min(a, b);
  }
}

export default SimpleMath;
