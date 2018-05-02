// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

import { staticImplements } from 'rr-tsdi';

import { IList } from './../../common';
import { IComplex, IComplexDto } from './../complex/complex.interface';
import { ISignal, ISignalDto, ISignalStatic } from './signal.interface';

@staticImplements<ISignalStatic>()
export class Signal implements ISignal {
  constructor(
    protected complexList: IList<IComplex>
  ) {
  }

  public clone(): ISignal {
    // TODO known bug here, it will clone the
    // list but Complex objects will be the same in both Signals
    return new Signal(
      this.complexList.clone()
    );
  }

  public getAt(position: number): IComplex {
    return this.complexList.getAt(position);
  }

  public setAt(position: number, sample: IComplex): ISignal {
    this.complexList.setAt(position, sample);

    return this;
  }

  public append(sample: IComplex): ISignal {
    this.complexList.append(sample);

    return this;
  }

  public appendEvenIfFull(sample: IComplex): ISignal {
    this.complexList.appendEvenIfFull(sample);

    return this;
  }

  public appendArray(sampleArray: IComplex[]): ISignal {
    this.complexList.appendArray(sampleArray);

    return this;
  }

  public takeFirst(): IComplex {
    return this.complexList.takeFirst();
  }

  public takeLast(): IComplex {
    return this.complexList.takeLast();
  }

  public fillWith(sample: IComplex, size?: number): ISignal {
    this.complexList.fillWith(sample, size);

    return this;
  }

  public isFull(): boolean {
    return this.complexList.isFull();
  }

  public isEmpty(): boolean {
    return this.complexList.isEmpty();
  }

  public setSizeMax(sizeMax: number): ISignal {
    this.complexList.setSizeMax(sizeMax);

    return this;
  }

  public getSizeMax(): number {
    return this.complexList.getSizeMax();
  }

  public getSize(): number {
    return this.complexList.getSize();
  }

  public forEach(callback: (sample: IComplex, index?: number) => void | boolean): ISignal {
    this.complexList.forEach(callback);

    return this;
  }

  public filter(callback: (sample: IComplex, index?: number) => boolean): ISignal {
    const complexList: IList<IComplex> = this.complexList.filter(callback);

    return new Signal(complexList);
  }

  public toArray(): IComplex[] {
    return this.complexList.toArray();
  }

  // ----------------------------------------------

  public toDto(): ISignalDto {
    return this.complexList
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

  public toRawIQ(): number[] {
    const rawIQ: number[] = [];

    this.complexList.forEach((value: IComplex): void => {
      rawIQ.push(...value.toRawIQ());
    });

    return rawIQ;
  }

  public isEqualTo(b: ISignal): boolean {
    let isEqual;

    if (this.complexList.getSize() !== b.getSize()) {
      return false;
    }

    isEqual = true;
    this.complexList.forEach((value: IComplex, index: number): boolean => {
      if (!value.isEqualTo(b.getAt(index))) {
        isEqual = false;
        return false;
      }
      return true;
    });

    return isEqual;
  }
}
