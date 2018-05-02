// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl
// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { List } from './../../common';
import { IComplex } from './../complex/complex.interface';
import { ISignal, ISignalStatic } from './signal.interface';

@staticImplements<ISignalStatic>()
export class Signal extends List<IComplex> implements ISignal {
  public dropRealPart(): ISignal {
    // TODO write the code

    return this;
  }

  public dropImaginaryPart(): ISignal {
    // TODO write the code

    return this;
  }
}
