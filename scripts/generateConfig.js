const { join, extname, basename } = require('path');
const fs = require('fs')

function getEntries () {
  const entries = {};
  const dir = join(__dirname, '..', 'src/pages');
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = join(dir, file);
    const stat = fs.statSync(fullPath);
    const en = extname(fullPath);
    const bn = basename(file);
    if (stat.isFile() && en === '.js') {
      // index.ios.js 和 index.android.js 共享配置
      entries[bn.split('.')[0]] = fullPath;
    }
  });
  return entries;
}

const entries = getEntries()

const objs = []
for (const key in entries) {
  const mainConfig = require(`../src/config/${key}.data.js`);
  // 暂时注释子组件配置
  // const subConfigPath = `../src/config/subconfig`;
  // const relaConfigPath = join(__dirname, `${subConfigPath}/sub_${key.toLocaleLowerCase()}_rela.json`)
  // let relaConfig = [];
  // if (fs.existsSync(relaConfigPath)) {
  //   relaConfig = require(`${subConfigPath}/sub_${key.toLocaleLowerCase()}_rela.json`);
  // } else {
  //   fs.writeFileSync(relaConfigPath, JSON.stringify([]))
  // }
  // mainConfig.subModules = {};
  // for (let i = 0; i < relaConfig.length; i++) {
  //   const subEntry = relaConfig[i].entry;
  //   if (subEntry) {
  //     const subConfigDataPath = join(__dirname, `${subConfigPath}/sub_${subEntry}.data.js`)
  //     let subConfig = {}
  //     if (fs.existsSync(subConfigDataPath)) {
  //       subConfig = require(`${subConfigPath}/sub_${subEntry}.data.js`);
  //     }
  //     mainConfig.subModules[subEntry] = subConfig;
  //   }
  // }

  objs.push({
    key,
    data: mainConfig,
    rule: require(`../src/config/${key}.rule.js`)
  })
}

for (let i = 0; i < objs.length; i++) {
  const obj = objs[i]
  const targetPath = join(__dirname, '..', 'build')
  let targetName = obj.key;
  targetName = targetName.substring(0, 1).toLocaleLowerCase() + targetName.substring(1)
  fs.writeFileSync(`${targetPath}/${targetName}DataConfig.js`, `module.exports = ${JSON.stringify(obj.data)}`)
  fs.writeFileSync(`${targetPath}/${targetName}DataRule.js`, `module.exports = ${JSON.stringify(obj.rule)}`)
}
