export class SymbolKeysNotSupportedError extends Error {
  constructor() {
    super('Symbol keys are not supported yet!');

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StaticGetPropertiesIsNotAFunctionError extends Error {
  constructor() {
    super('getProperties is not a function!');

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
