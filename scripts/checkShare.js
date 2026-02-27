const { exec } = require('child_process');
const path = require('path');
const {join, basename} = require('path');
const fs = require('fs');

/**
 * 获取build之后的js文件
 */
function getFile() {
  const entries = [];
  const dir = join(__dirname, '..', 'build/static/js');
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = join(dir, file);
    const stat = fs.statSync(fullPath);
    const bn = basename(file);

    if (stat.isFile()) {
      entries.push(bn);
    }
  });

  return entries;
}

/**
 * 检查打包之后的代码，是否有设置了二次分享
 * @returns 
 */
function checkShare() {
  const entries = getFile();

  let initShareCode = 0;

  for (let k in entries) {
    let data = fs.readFileSync(`./build/static/js/${entries[k]}`);

    const reg = RegExp(/.resetShareData\(/);
    if (data && data.toString().match(reg)) {
      initShareCode++;
    }
  }

  if (initShareCode < 1) {
    // 没有设置端外二次分享
    const tips = "---------------------\n 你的项目没有设置端外二次分享文案\n\n 项目规则：\n 1、投放到端外的项目都需要设置分享文案，图片等信息 \n 2、只投放端内、只投放端内、只投放端内【重要事情说三次】可以不设置分享信息 \n\n 设置端外二次分享方法： \n 具体方法参考组件 @kugou/share \n---------------------";
    console.error("\x1B[35m%s\x1b[39m", tips);

    console.log('\x1B[33m%s\x1b[39m', "\n 已知悉投放端外项目必须设置分享新规则\n 如果你这个项目只投放在端内，无需设置二次分享文案，可以继续发布? （Y - 继续）");
    
    // 没有设置分享，不需要提醒开发二次检查了
    return false;
  }

  // 已经设置过二次分享了，提醒二次检查一下
  doubleCheck();
}

function doubleCheck() {
  // 没有设置端外二次分享
  console.log('\x1B[35m%s\x1b[39m', "\n 提示：\n 认真再检查端外二次分享文案与端外分享设置时机 \n 1、页面初始化设置 \n 2、接口返回数据再设置（这个时候页面初始化的时候应该给个默认值） \n");
  console.log('\x1B[33m%s\x1b[39m', "\n 已认真检查二次分享设置，可以继续发布? （Y - 继续）\n");

  return false;
}

module.exports = checkShare;