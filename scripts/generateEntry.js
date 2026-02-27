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
      entries[bn.replace('.js', '')] = fullPath;
    }
  });
  return entries;
}

const entries = getEntries();

const tplStr = fs.readFileSync(join(__dirname, '..', 'public/entryTpl.js'), 'utf-8');

function deleteall (path) {
  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file) {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteall(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const targetPath = join(__dirname, '..', 'src/entrys')
const configPath = join(__dirname, '..', 'src/config')

/**
 * 删除重建
 */
deleteall(targetPath)
fs.mkdirSync(targetPath)

for (let key in entries) {
  let entryName = key.split('.').join('_')
  let UpperEntryName = entryName.substring(0, 1).toUpperCase() + entryName.substring(1)
  entryName = entryName.substring(0, 1).toLocaleLowerCase() + entryName.substring(1);
  fs.writeFileSync(targetPath + `/${entryName}.js`, tplStr.replace('##PAGE_NAME##', key))

  // 自动生成data和rule文件
  if (!fs.existsSync(configPath + `/${UpperEntryName}.data.js`)) {
    fs.writeFileSync(configPath + `/${UpperEntryName}.data.js`, `module.exports = {}`)
  }
  if (!fs.existsSync(configPath + `/${UpperEntryName}.rule.js`)) {
    fs.writeFileSync(configPath + `/${UpperEntryName}.rule.js`, `const propTypes = require('@kugou/voo-prop-types');module.exports = {}`)
  }
  // 暂时注释子组件配置
  // 自动生成sub_entry_rela.json文件
  // if (!fs.existsSync(configPath + `/subconfig/sub_${entryName.toLocaleLowerCase()}_rela.json`)) {
  //   fs.writeFileSync(configPath + `/subconfig/sub_${entryName.toLocaleLowerCase()}_rela.json`, `[]`)
  // }
}
