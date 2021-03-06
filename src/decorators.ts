import {TypeDecoratorParams, ReturnTypeFunc, FieldOptions, ClassType, FieldMetadata} from './interface';
import {SymbolKeysNotSupportedError} from './exceptions';
import {IDE_PROPERTY_METADATA, COMPONENT_EXECUTE_MODE_METADATA} from './constants';

function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

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
  let isArray = type === Array;
  const str = transformBasicType(type);
  if (str !== 'unknown') {
    type = str;
  }
  if (returnTypeFunction) {
    const returnType = returnTypeFunction();
    if (Array.isArray(returnType)) {
      isArray = true;
      // not support Tuples yet
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
export function Field(returnTypeFunction?: ReturnTypeFunc | FieldOptions, maybeOptions?: FieldOptions): PropertyDecorator;
export function Field(returnTypeFunction?: ReturnTypeFunc | FieldOptions, maybeOptions?: FieldOptions): PropertyDecorator {
  return (target, propertyKey) => {
    if (typeof propertyKey === 'symbol') {
      throw new SymbolKeysNotSupportedError();
    }

    const {options, returnTypeFunc} = getTypeDecoratorParams(returnTypeFunction, maybeOptions);
    defineTypes(target, propertyKey, options, returnTypeFunc);
  };
}

export function getPropertiesOf<
  T extends ClassType<any> & {
    componentName?: string;
  },
>(target: T, isRoot = true): FieldMetadata {
  const properties = Reflect.getMetadata(IDE_PROPERTY_METADATA, target) || {};
  const name = target.componentName;
  const rootObject: FieldMetadata = {
    name,
    type: name,
    isArray: false,
  };
  if (isRoot) {
    rootObject.isFolder = true;
  }
  if (!Object.keys(properties).length && target.componentName) {
    return rootObject;
  }

  rootObject.type = 'object';
  rootObject.children = [];
  Object.keys(properties).forEach(propertyKey => {
    if (isFunction(properties[propertyKey].type)) {
      const maybeBasicType = transformBasicType(properties[propertyKey].type);
      if (maybeBasicType !== 'unknown') {
        properties[propertyKey].type = maybeBasicType;
      } else {
        const child = getPropertiesOf(properties[propertyKey].type, false);
        properties[propertyKey].type = 'object';
        if (!properties[propertyKey].children) {
          properties[propertyKey].children = [];
        }
        properties[propertyKey].children.push(...child.children);
      }
    }
    if (!properties[propertyKey].name) {
      properties[propertyKey].name = propertyKey;
    }
    if (properties[propertyKey].isArray) {
      properties[propertyKey].addable = true;
    }
    rootObject.children.push(properties[propertyKey]);
  });
  return rootObject;
}

enum ExecuteMode {
  Edit = 1 << 1,
  Game = 1 << 2,
  All = Edit | Game,
}

export const ExecuteInEditMode: ClassDecorator = target => {
  Reflect.defineMetadata(COMPONENT_EXECUTE_MODE_METADATA, ExecuteMode.Edit, target);
};

export const shouldExecuteInEditMode = (target: ClassType): boolean => {
  const mode = Reflect.getMetadata(COMPONENT_EXECUTE_MODE_METADATA, target);
  return !!(mode & ExecuteMode.Edit);
};
