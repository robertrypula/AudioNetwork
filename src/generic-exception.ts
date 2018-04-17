// Copyright (c) 2015-2018 Robert Rypuła - https://audio-network.rypula.pl

// TODO think more about this class vs Dependency Injection
class GenericException {
  constructor(
    protected message: string = 'Something went terrible wrong',
    protected value: any = null
  ) {
  }

  public getMessage(): string {
    return this.message;
  }

  public getValue(): any {
    return this.value;
  }

  public toString(): string {
    return this.message + ' - ' + this.value;
  }
}

export default GenericException;
