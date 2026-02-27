/*
 * @Author: Tracer Lee, Evan Chen
 * @Date: 2020-09-22 14:30:23
 * @LastEditTime: 2020-10-28 15:00:58
 * @Description: 创建离线包文件夹
 */
const fs = require('fs-extra');
const packageJson = require('../package.json');
if (!packageJson.pigeonId) {
  console.log('package.json缺少pigeonId。\n如果不知道id，请联系离线包管理员。')
  return
}
const insertString = `<script src="https://staticssl.kugou.com/pigeon/${packageJson.pigeonId}.js"></script>`

fs.removeSync('build2'); // 删除文件夹

fs.ensureDirSync('build2'); // 新建文件夹

fs.copySync('build', 'build2'); // 拷贝文件夹

const bacs = fs.readdirSync('build2').filter(v => v.includes('.bac'));

// 创建 html
bacs.forEach(f => {
  // 注入script标签，删除bac文件
  fs.writeFileSync('build2/' + f.replace('.bac', '.html'), fs.readFileSync('build2/' + f, 'utf-8').replace('</body>', `${insertString}</body>`));
  fs.removeSync('build2/' + f);
})
