// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { LIST_FACTORY } from './../../common';
import { COMPLEX_FACTORY } from './../complex/di-token';

import { IList, IListFactory } from './../../common';
import { IComplexFactory } from './../complex/complex-factory.interface';
import { IComplex, IComplexDto } from './../complex/complex.interface';
import { IComplexListDto, IComplexListUtil, IComplexListUtilStatic } from './complex-list-util.interface';

@staticImplements<IComplexListUtilStatic>()
class ComplexListUtil implements IComplexListUtil {
  public static $inject: string[] = [
    COMPLEX_FACTORY,
    LIST_FACTORY
  ];

  constructor(
    protected complexFactory: IComplexFactory,
    protected listFactory: IListFactory
  ) {
  }

  public fromDto(complexListDto: IComplexListDto): IList<IComplex> {
    const tmp = complexListDto.map((complexDto: IComplexDto) => {
      return this.complexFactory.createFromDto(complexDto);
    });

    return this.listFactory.createFromArray<IComplex>(tmp);
  }

  public toDto(complexList: IList<IComplex>): IComplexListDto {
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
}

export default ComplexListUtil;
