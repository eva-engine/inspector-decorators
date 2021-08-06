function getIDEPropsPropertyObj(target, propertyKey) {
  //@ts-ignore
  if (!target.constructor.IDEProps) {
    //@ts-ignore
    target.constructor.IDEProps = {};
  }
  if (!target.constructor.IDEProps[propertyKey]) {
    target.constructor.IDEProps[propertyKey] = {};
  }
  const propertyObj = target.constructor.IDEProps[propertyKey];
  return propertyObj;
}

export {
  getIDEPropsPropertyObj,
};
