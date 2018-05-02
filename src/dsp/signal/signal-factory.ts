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

  public create(sizeMax: number): ISignal {
    const complexList: IList<IComplex> = this.listFactory.create<IComplex>(sizeMax);

    return new Signal(complexList);
  }

  public createFromComplexArray(complexArray: IComplex[], sizeMax?: number): ISignal {
    let complexList: IList<IComplex>;
    let sizeMaxFinal: number;
    let i;

    sizeMaxFinal = (sizeMax === undefined) ? complexArray.length : sizeMax;
    complexList = this.listFactory.create<IComplex>(sizeMaxFinal);
    for (i = 0; i < complexArray.length; i++) {
      complexList.appendEvenIfFull(complexArray[i]);
    }

    return new Signal(complexList);
  }

  public createFromDto(signalDto: ISignalDto): ISignal {
    let tmp: IComplex[];

    tmp = signalDto.map(
      (complexDto: IComplexDto): IComplex => {
        return this.complexFactory.createFromDto(complexDto);
      }
    );

    return this.createFromComplexArray(tmp);
  }

  public createFromRawIQ(rawIQ: number[]): ISignal {
    const tmp: IComplex[] = [];
    let complex: IComplex;
    let i: number;

    if (rawIQ.length % 2 === 1) {
      throw new GenericException(RAW_IQ_ARRAY_LENGTH_NEEDS_TO_BE_EVEN);
    }

    for (i = 0; i < rawIQ.length; i += 2) {
      complex = this.complexFactory.create(rawIQ[i], rawIQ[i + 1]);
      tmp.push(complex);
    }

    return this.createFromComplexArray(tmp);
  }
}

const RAW_IQ_ARRAY_LENGTH_NEEDS_TO_BE_EVEN = 'Raw IQ array length needs to be even';
