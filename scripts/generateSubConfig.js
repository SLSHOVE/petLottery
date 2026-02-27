const { join, basename } = require('path');
const fs = require('fs')

function getFiles () {
  const files = {};
  const dir = join(__dirname, '..', 'src/config/subconfig');
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = join(dir, file);
    const bn = basename(file);
    files[bn] = fullPath;
  });
  return files;
}
// 1. 复制subconfig文件到build中
const files = getFiles()
for (const key in files) {
  const file = files[key]
  let data = require(file)
  const targetPath = join(__dirname, '..', 'build')
  let targetName = key;
  if (targetName.indexOf('.json') === -1) {
    data = `module.exports = ${JSON.stringify(data)}`
  } else {
    data = JSON.stringify(data)
  }
  try {
    fs.writeFileSync(`${targetPath}/${targetName}`, data)
  } catch (e) {
  }
}