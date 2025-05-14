const makeScopeList = (user) =>{
  let fruitScope = 0;
  let waterScope = 0;
  user.inventory.fruitScope.forEach((value) => {
    fruitScope = fruitScope + Number(value.scope);
  })
  user.inventory.waterScope.forEach((value) => {
    waterScope = waterScope + Number(value.scope);
  })

  const scopeList = [
    {type:'coinScope', scope: Number(user.inventory.tokenScope)},
    {type:'fruitScope', scope: fruitScope},
    {type:'waterScope', scope: waterScope},
  ];
  return scopeList;
}

module.exports = makeScopeList;