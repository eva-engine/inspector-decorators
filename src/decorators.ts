import {TypeDecoratorParams, ReturnTypeFunc, FieldOptions, ClassType, FieldMetadata} from './interface';
import {SymbolKeysNotSupportedError} from './exceptions';
import {IDE_PROPERTY_METADATA} from './constants';

function transformBasicType(type: unknown): 'string' | 'number' | 'boolean' | 'unknown' {
  if (type === String) {
    return 'string';
  }
  if (type === Number) {
    return 'number';
  }
  if (type === Boolean) {
    return 'boolean';
  }
  return 'unknown';
}

function defineTypes(target: any, key: string | symbol, options: FieldOptions, returnTypeFunction?: ReturnTypeFunc) {
  let type = Reflect.getMetadata('design:type', target, key);
  const isArray = type === Array;
  const str = transformBasicType(type);
  if (str !== 'unknown') {
    type = str;
  }
  if (returnTypeFunction) {
    const returnType = returnTypeFunction();
    if (Array.isArray(returnType)) {
      type = returnType[0];
    } else {
      type = returnType;
    }
  }
  const properties = Reflect.getMetadata(IDE_PROPERTY_METADATA, target.constructor) || {};
  properties[key] = {
    type,
    isArray: isArray,
    ...options,
  };
  Reflect.defineMetadata(IDE_PROPERTY_METADATA, properties, target.constructor);
}

function getTypeDecoratorParams(
  returnTypeFuncOrOptions: ReturnTypeFunc | FieldOptions | undefined,
  maybeOptions: FieldOptions | undefined,
): TypeDecoratorParams {
  if (typeof returnTypeFuncOrOptions === 'function') {
    return {
      returnTypeFunc: returnTypeFuncOrOptions,
      options: maybeOptions || {},
    };
  }
  return {
    options: returnTypeFuncOrOptions || {},
  };
}

export function Field(): PropertyDecorator;
export function Field(options: FieldOptions): PropertyDecorator;
export function Field(returnTypeFunction?: ReturnTypeFunc): PropertyDecorator;
export function Field(returnTypeFunction?: ReturnTypeFunc | FieldOptions, maybeOptions?: FieldOptions): PropertyDecorator {
  return (target, propertyKey) => {
    if (typeof propertyKey === 'symbol') {
      throw new SymbolKeysNotSupportedError();
    }

    const {options, returnTypeFunc} = getTypeDecoratorParams(returnTypeFunction, maybeOptions);
    defineTypes(target, propertyKey, options, returnTypeFunc);
  };
}

export function getPropertiesOf<T extends ClassType<any>>(target: T): FieldMetadata<InstanceType<T>> {
  const properties = Reflect.getMetadata(IDE_PROPERTY_METADATA, target) || {};
  Object.keys(properties).forEach(propertyKey => {
    if (typeof properties[propertyKey].type === 'function') {
      if ('getProperties' in properties[propertyKey].type) {
        properties[propertyKey].type = properties[propertyKey].type.getProperties();
      } else {
        const maybeBasicType = transformBasicType(properties[propertyKey].type);
        if (maybeBasicType !== 'unknown') {
          properties[propertyKey].type = maybeBasicType;
        } else {
          properties[propertyKey].type = getPropertiesOf(properties[propertyKey].type);
        }
      }
    }
  });
  return properties;
}
