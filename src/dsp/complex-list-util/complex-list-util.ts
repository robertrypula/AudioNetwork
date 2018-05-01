// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { LIST_FACTORY } from './../../common';
import { COMPLEX_FACTORY } from './../complex/di-token';

import { GenericException, IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';
import { IComplexList, IComplexListDto, IComplexListUtil, IComplexListUtilStatic } from './complex-list-util.interface';

@staticImplements<IComplexListUtilStatic>()
export class ComplexListUtil implements IComplexListUtil {
  public static $inject: string[] = [
    COMPLEX_FACTORY,
    LIST_FACTORY
  ];

  constructor(
    protected complexFactory: IComplexFactory,
    protected listFactory: IListFactory
  ) {
  }

  public fromDto(complexListDto: IComplexListDto): IComplexList {
    const tmp = complexListDto.map((complexDto: IComplexDto): IComplex => {
      return this.complexFactory.createFromDto(complexDto);
    });

    return this.listFactory.createFromArray<IComplex>(tmp);
  }

  public fromRawIQ(rawIQ: number[]): IComplexList {
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

    return this.listFactory.createFromArray<IComplex>(tmp);
  }

  public toDto(complexList: IComplexList): IComplexListDto {
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

  public toRawIQ(complexList: IComplexList): number[] {
    const rawIQ: number[] = [];

    complexList.forEach((value: IComplex): void => {
      rawIQ.push(...value.toRawIQ());
    });

    return rawIQ;
  }

  public isEqual(a: IComplexList, b: IComplexList): boolean {
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
