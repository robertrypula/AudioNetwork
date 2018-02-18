import { ISimpleMath } from './../../common/simple-math/simple-math.interface';
import Complex from './../complex';
import { IComplexFactory } from './complex-factory.interface';

class ComplexFactory implements IComplexFactory {
  private simpleMath: ISimpleMath;

  constructor(simpleMath: ISimpleMath) {
    this.simpleMath = simpleMath;
  }

  public create(real: number = 0, imaginary: number = 0): Complex {
    return new Complex(this.simpleMath, real, imaginary);
  }

  public createZero(): Complex {
    return new Complex(this.simpleMath, 0, 0);
  }

  public createPolar(unitAngle: number = 0, magnitude: number = 1): Complex {
    const radian: number = 2 * this.simpleMath.getPi() * unitAngle;

    return this.create(
      magnitude * this.simpleMath.cos(radian),
      magnitude * this.simpleMath.sin(radian)
    );
  }
}
