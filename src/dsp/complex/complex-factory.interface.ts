import { ISimpleMath } from '../../common/simple-math/simple-math.interface';
import { IComplex } from './../complex.interface';

interface IComplexFactory {
  create(real: number, imaginary: number): IComplex;
  createZero(): IComplex;
  createPolar(unitAngle: number): IComplex;
}

interface IComplexFactoryStatic {
  new(simpleMath: ISimpleMath): IComplexFactory;
}

export {
  IComplexFactory,
  IComplexFactoryStatic
};
