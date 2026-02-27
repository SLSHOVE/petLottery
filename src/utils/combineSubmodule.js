export default function combineSubmodule (entry) {
  const mainConfig = require(`../config/${entry}.data.js`);
  // 暂时注释子组件配置
  // const relaConfig = require(`../config/subconfig/sub_${entry.toLocaleLowerCase()}_rela.json`);
  // mainConfig.subModules = {};
  // for (let i = 0; i < relaConfig.length; i++) {
  //   const subEntry = relaConfig[i].entry;
  //   const subConfig = require(`../config/subconfig/sub_${subEntry}.data.js`);
  //   mainConfig.subModules[subEntry] = subConfig;
  // }
  return mainConfig;
}
