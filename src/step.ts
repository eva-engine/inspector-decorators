export default function step(step: number) {
  return function (target: any, propertyKey: string) {
    //@ts-ignore
    if (!target.constructor.IDEProps) {
      //@ts-ignore
      target.constructor.IDEProps = {};
    }
    if (!target.constructor.IDEProps[propertyKey]) {
      target.constructor.IDEProps[propertyKey] = {};
    }
    const prop = target.constructor.IDEProps[propertyKey];
    //@ts-ignore
    prop.step = step;
  };
}
