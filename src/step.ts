import { getIDEPropsPropertyObj } from './util';

export default function step(step: number) {
  return function (target: any, propertyKey: string) {
    const prop = getIDEPropsPropertyObj(target, propertyKey);
    //@ts-ignore
    prop.step = step;
  };
}
