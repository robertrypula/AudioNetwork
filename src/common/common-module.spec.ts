// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { Injector } from 'rr-tsdi';

import { COMMON_MODULE } from './di-token';
import { LIST_FACTORY } from './list/di-token';
import { SIMPLE_MATH } from './simple-math/di-token';

import CommonModule from './common-module';
import { ICommonModule } from './common.interface';
import ListFactory from './list/list-factory';
import SimpleMath from './simple-math/simple-math';

describe('CommonModule', () => {
  it('should properly provide all expected items', () => {
    const injector = new Injector();
    let commonModule: ICommonModule;

    injector.registerService(LIST_FACTORY, ListFactory);
    injector.registerService(SIMPLE_MATH, SimpleMath);
    injector.registerService(COMMON_MODULE, CommonModule);

    commonModule = injector.get(COMMON_MODULE);

    expect(commonModule).toBeInstanceOf(CommonModule);
    expect(commonModule.listFactory).toBeInstanceOf(ListFactory);
    expect(commonModule.simpleMath).toBeInstanceOf(SimpleMath);
  });
});
