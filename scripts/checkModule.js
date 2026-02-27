const { exec } = require('child_process');
const path = require('path');
const {basename} = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

const CHECK_KEY = 'checkModule'

// 用于遍历文件夹
function traverseModules(directory) {
  const nodeModulesPath = path.join(__dirname, directory);
  const modules = fs.readdirSync(nodeModulesPath);
  const finalArr = []

  for (const module of modules) {
    const jsonPath = path.join(nodeModulesPath, module, 'package.json');
    try {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      const packageJson = JSON.parse(data);
      finalArr.push([
        packageJson.name,
        packageJson.version
      ])
    } catch (e) {
      // 打印读取 package.json 失败的模块
      console.log(`Failed to load package.json for ${module}: ${e.message}`);
    }
  }

  return new Map(finalArr);
}

/**
 * 检查package.json文件是否有可以开启检查版本的按钮
 * 检查@kugou的包有没有安装正确的版本
 * @returns
 */
async function checkModule() {
  const {checkModule ={}, dependencies={}, devDependencies={}} = packageJson
  const modules = traverseModules('../node_modules/@kugou');
  const {list, open}= checkModule

  let checkError = false
  let errorList = []

  if(open && list && list.length > 0){
    const listMap = new Map(Object.entries(dependencies).concat(Object.entries(devDependencies )))
    // console.log(listMap)
    list.map(item=>{
      const key = item

      //必须安装这个包才会去校验版本
      if(key && key.includes && key.includes('kugou') && listMap.has(key)){
        const value =  listMap.get(key)
        const regex = /\d+(\.\d+){2}/;
        const versionStr = value.match(regex)[0];

        const version = versionStr.split('.').join('.');
        const nowVersion = modules.get(key)

        if(!nowVersion){
          checkError = true
          errorList.push(`${key}，目前没有安装，期望的版本是${version}`)
        }else if(version !== nowVersion){
          checkError = true
          errorList.push(`${key}，目前是${nowVersion}，期望的版本是${version}`)
        }
      }

      return item
    })
  }

  if(checkError){
    console.log("--------------------");
    console.log('版本错误：')
    console.log(errorList.join('\n'))
    console.log("--------------------");
    console.log("  ______   ______   ______   ______   ______   ______ \n" +
        " /_____/  /_____/  /_____/  /_____/  /_____/  /_____/\n");
    console.log('\x1B[38;2;231;72;86m%s\x1b[0m', "你的node_modules包版本错误，是否继续发布? （Y - 继续）");
  }

  return checkError
}
//本地调试检查
// checkModule()
module.exports = checkModule;