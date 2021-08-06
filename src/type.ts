import { getIDEPropsPropertyObj } from './util';

export default function type(type: string) {
  return function (target: any, propertyKey: string) {
    const prop = getIDEPropsPropertyObj(target, propertyKey);
    //@ts-ignore
    prop.key = propertyKey;
    prop.type = type;
  };
}
