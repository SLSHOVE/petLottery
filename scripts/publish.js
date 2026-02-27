const { exec } = require('child_process');
const path = require('path');
const request = require('request');
const checkRule = require('./checkRule.js');
const checkShare = require('./checkShare.js');
const checkModule = require('./checkModule.js');
const sendMessageToVoo = require('./vooMessage.js');
// const fs = require('fs')

const VOO_DOMAIN = 'voo.kugou.net';
// const VOO_DOMAIN = 'test.kugou.com:8099';
// const VOO_DOMAIN = '10.16.4.19:8099';

function noCacheRequire(path){
  delete require.cache[require.resolve(path)];
  return require(path);
}

function query(options) {
  return new Promise((resolve) => {
    request(options, function(e, r, b) {
      if (!e) {
        resolve({
          success: 0,
          body: b,
          headers: r.headers
        });
      } else {
        console.log(e)
        resolve({
          success: -1
        });
      }
    });
  });
};

function sh (commend, cwd='./') {
  return new Promise(function(resolve) {
    const work = exec(commend, { cwd: cwd }, function (err, stdout, stderr) {
      // console.log(err, stderr)
      if(err) {
        // console.log(err);
        resolve({
          code: -1,
          msg: JSON.stringify(err)
        });
      } else {
        // console.log(`stdout: ${stdout}`);
        resolve({
          code: 1,
          stdout
        })
      }
    })

    work.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    work.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    })
  })
}

async function getReat () {
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    process.stdin.setEncoding('utf8');

    process.stdin.once('data', (data) => {
      data = data.replace('\n', '').trim();
      resolve(data);

      process.stdin.pause();
    });
  });
}

async function run () {
  // package.json 配置
  let config = noCacheRequire('../package.json');

  const ruleTips = await checkRule();

  if (ruleTips.length > 0) {
    for (let i = 0; i < ruleTips.length; i++) {
      console.log(ruleTips[i]);
    }
    console.log("  ______   ______   ______   ______   ______   ______ \n" +
      " /_____/  /_____/  /_____/  /_____/  /_____/  /_____/\n");
    console.log('\x1B[35m%s\x1b[39m', "你的 rule 和 data 配置可能有差异，是否继续发布? （Y - 继续）");
    let read = await getReat();
    if (read.indexOf("Y") === -1 && read.indexOf("y") === -1) {
      return
     }
  }

  if (config.version !== '1.0.0') {
    // 获取版本号
    const latestVerFlag = await sh(`npm view ${config.name} version --registry=https://knpm.tmeoa.com/`, path.join(__dirname, '..'));
    let latestVer = latestVerFlag
    if (latestVerFlag.code === 1) {
      latestVer = latestVer.stdout.split('\n')[0];
      console.log('------------------获取最新版本为：' + latestVer);
      // 当前组件版本和npm中版不一致
      if (config.version !== latestVer) {
        console.log('\x1B[33m%s\x1b[39m', "\n 当前版本和npm中版本不一致，请检查版本");
        console.log('\x1B[33m%s\x1b[39m', "\n 如果确认版本没问题，可以继续发布 （Y - 继续）\n");
        let read = await getReat();
        if (read !== "Y" && read !== "y" && read !== "yes") {
          return
        }
      }
    }
  }

  // 升级版本号
  console.log('--------------------升级版本号')
  const versionFlag = await sh('npm version patch', path.join(__dirname, '..'));
  if (versionFlag.code === 1) {
    console.log('------------------升级版本成功');
  } else {
    console.log(versionFlag.msg);
    return;
  }

  // 更新packageconfig
  config = noCacheRequire('../package.json');

  if (config.name.indexOf('@voo/') !== 0) {
    console.error('模块名请使用 @voo/ 开头');
    return;
  }

  if (!config.description) {
    console.error('请在 package.json 输入模板名: description');
    return;
  }

  if (!config.cover) {
    console.error('请在 package.json 输入模板封面: cover');
    return;
  }

  if (!config.mtpId) {
    console.error('请在 package.json 输入关联任务id: mtpId');
    return;
  }

  if (!config.pmsId) {
    console.error('请在 package.json 输入关联需求id: pmsId');
    return;
  }






  if (!config.tags) {
    console.error('请在 package.json 输入模板标签（多个标签用逗号隔开）：tags');
    return;
  }

  if (!config.author) {
    console.error('请在 package.json 输入模板作者：author');
    return;
  }

  // build
  console.log('--------------------开始构建，请稍候...')
  const buildFlag = await sh('npm run build');
  if (buildFlag.code === 1) {
    console.log('-----------------构建成功');
  } else {
    console.log(buildFlag.msg);
    return;
  }

  // console.log('--------------------混入es6代码到打包文件中')
  // fs.writeFileSync(path.join(__dirname, '..', 'build/es6code.js'), 'const a = 1')

  console.log('--------------------开始检查打包代码是否符合es5规范，请稍候...')
  const checkES5Flag = await sh('es-check es5 "./build/**/*.js"')
  if (checkES5Flag.code === 1) {
    console.log('-----------------打包代码符合es5规范');
  } else {
    console.log('es5语法规范检查失败', checkES5Flag.msg);
    return;
  }

  // 检查是否有设置二次分享的文案
  const resCheckShare = await checkShare();
  if (!resCheckShare) {
    // 二次分享文案检查提示

    let read = await getReat();
    if (read.indexOf("Y") === -1 && read.indexOf("y") === -1) {
      return;
    }
  }

  // 检查是否包版本有没有出错
  const resCheckModuleError = await checkModule();
  if (resCheckModuleError) {
    // 有错误展示提示

    let read = await getReat();
    if (read.indexOf("Y") === -1 && read.indexOf("y") === -1) {
      return;
    }
  }

  // 发布包
  console.log('------------------------开发发布包到npm')
  const pubFlag = await sh('npm publish --registry https://knpm.tmeoa.com', path.join(__dirname, '..', 'build'));
  if (pubFlag.code === 1) {
    console.log('----------------------包发布成功');
  } else {
    console.log(pubFlag.msg);
    return;
  }

  // 读取 npm 用户名
  console.log('------------------------读取npm用户名，作为模板开发者')
  const whoamiObj = await sh('knpm whoami');
  const username = whoamiObj.stdout.replace(/^\s*|\s*$/g, '');;
  // 到 voo 创建模板
  console.log('--------------------开始推送模板信息到voo平台')
  const reqOptions = {
    uri: `http://${VOO_DOMAIN}/public/pushTpl`,
    method: 'POST',
    json: {
      moduleName: config.name,
      version: config.version,
      author: username,
      tplName: config.description,
      tags: config.tags,
      cover: config.cover,
      mtpId: config.mtpId,
    }
  }
  const result = await query(reqOptions);
  // 到 voo 上报包信息
  let packageJson = noCacheRequire("../package.json");
  packageJson.name = config.name;
  packageJson.version = config.version
  console.log('--------------------开始上报 package 信息')
  const reportPackageOptions = {
    uri: `http://${VOO_DOMAIN}/public/createWithPackageJson`,
    method: 'POST',
    json: {
      packageJson: packageJson,
    }
  }
  query(reportPackageOptions);
  if (result.success === 0) {
    const body = result.body;
    if (body.code === '0000') {
      console.log('----------------------voo 模板创建成功');
    } else {
      console.log('----------------------voo 模板创建失败,body.msg: ', body.msg);
      console.log('请尝试重新publish');
      return
    }
  } else {
    console.log('网络错误，voo 模板创建失败');
    console.log('请尝试重新publish');
    return
  }

  

  // 自动打 tag
  const addTagFlag = await sh('git tag ' + config.version, path.join(__dirname, '..'));
  if (addTagFlag.code === 1) {
    console.log('..........................打 tag 成功')
  } else {
    console.log(addTagFlag.msg);
    return;
  }
  const pushTagFlag = await sh('git push origin ' + config.version, path.join(__dirname, '..'));
  if (pushTagFlag.code === 1) {
    console.log('..........................tag 推送远程成功')
  } else {
    console.log(pushTagFlag.msg);
    return;
  }

  // 自动 push分支代码
  let currentBranch = await sh('git rev-parse --abbrev-ref HEAD', path.join(__dirname, '..'));
  currentBranch = currentBranch.stdout.toString().replace(/\s+/, '')
  const pushFlag = await sh('git push origin ' + currentBranch, path.join(__dirname, '..'));
  if (pushFlag.code === 1) {
    console.log('..........................git push 成功')
  } else {
    console.log('..........................自动push失败，请手动提交代码到仓库');
    return;
  }
}

run();
process.stdin.end();
