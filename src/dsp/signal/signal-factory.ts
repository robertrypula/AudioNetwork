// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { LIST_FACTORY } from './../../common';
import { COMPLEX_FACTORY } from './../complex/di-token';

import { GenericException, IList, IListFactory, ISimpleMath } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';
import { Signal } from './signal';
import { ISignalFactory, ISignalFactoryStatic } from './signal-factory.interface';
import { ISignal, ISignalDto } from './signal.interface';

@staticImplements<ISignalFactoryStatic>()
export class SignalFactory implements ISignalFactory {
  public static $inject: string[] = [
    COMPLEX_FACTORY,
    LIST_FACTORY
  ];

  constructor(
    protected complexFactory: IComplexFactory,
    protected listFactory: IListFactory
  ) {
  }

  public create(maxSize: number): ISignal {
    const complexList = this.listFactory.create<IComplex>(maxSize);

    return new Signal(complexList);
  }

  public createFromArray(complexArray: IComplex[], maxSize?: number): ISignal {
    let complexList: IList<IComplex>;
    let result: ISignal;
    let sizeMaxFinal: number;
    let i;

    sizeMaxFinal = (maxSize === undefined) ? complexArray.length : maxSize;
    complexList = this.listFactory.create<IComplex>(sizeMaxFinal);
    result = new Signal(complexList);
    for (i = 0; i < complexArray.length; i++) {
      result.appendEvenIfFull(complexArray[i]);
    }

    return result;
  }

  public fromDto(complexListDto: ISignalDto): ISignal {    // TODO rename me
    let tmp: IComplex[];

    tmp = complexListDto.map(
      (complexDto: IComplexDto): IComplex => {
        return this.complexFactory.createFromDto(complexDto);
      }
    );

    return this.createFromArray(tmp);
  }

  public fromRawIQ(rawIQ: number[]): ISignal {    // TODO rename me
    const tmp: IComplex[] = [];
    let i: number;

    if (rawIQ.length % 2 === 1) {
      throw new GenericException(RAW_IQ_ARRAY_LENGTH_NEEDS_TO_BE_EVEN);
    }

    for (i = 0; i < rawIQ.length; i += 2) {
      tmp.push(
        this.complexFactory.create(rawIQ[i], rawIQ[i + 1])
      );
    }

    return this.createFromArray(tmp);
  }

  public toDto(complexList: ISignal): ISignalDto {  // TODO refactor me - move to Signal class
    return complexList
      .toArray()
      .map(
        (value: IComplex): IComplexDto => {
          /* tslint:disable:object-literal-sort-keys */
          return {
            real: value.getReal(),
            imaginary: value.getImaginary()
          };
          /* tslint:enable:object-literal-sort-keys */
        }
      );
  }

  public toRawIQ(complexList: ISignal): number[] {  // TODO refactor me - move to Signal class
    const rawIQ: number[] = [];

    complexList.forEach((value: IComplex): void => {
      rawIQ.push(...value.toRawIQ());
    });

    return rawIQ;
  }

  public isEqual(a: ISignal, b: ISignal): boolean {  // TODO refactor me - move to Signal class
    let isEqual;

    if (a.getSize() !== b.getSize()) {
      return false;
    }

    isEqual = true;
    a.forEach((value: IComplex, index: number): boolean => {
      if (!value.isEqualTo(b.getAt(index))) {
        isEqual = false;
        return false;
      }
      return true;
    });

    return isEqual;
  }
}

const RAW_IQ_ARRAY_LENGTH_NEEDS_TO_BE_EVEN = 'Raw IQ array length needs to be even';
