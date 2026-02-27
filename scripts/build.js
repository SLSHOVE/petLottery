

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');


const path = require('path');
const chalk = require('react-dev-utils/chalk');
const fs = require('fs-extra');
const webpack = require('@kugou/webpack');
const bfj = require('bfj');
const configFactory = require('../config/webpack.config');
const paths = require('../config/paths');
// const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const printHostingInstructions = require('react-dev-utils/printHostingInstructions');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;
const useYarn = fs.existsSync(paths.yarnLockFile);
const packageJson = require('../package.json');

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
// if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
//   process.exit(1);
// }

// Process CLI arguments
const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf('--stats') !== -1;

// Generate configuration
const config = configFactory('production');

// We require that you explicitly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // First, read the current file sizes in build directory.
    // This lets us display how much they changed later.
    return measureFileSizesBeforeBuild(paths.appBuild);
  })
  .then(previousFileSizes => {
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);
    // Merge with the public folder
    // copyPublicFolder();
    // Start the webpack build
    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      copyPublicFolder();
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log(
          '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.'
        );
        console.log(
          'To ignore, add ' +
            chalk.cyan('// eslint-disable-next-line') +
            ' to the line before.\n'
        );
      } else {
        console.log(chalk.green('Compiled successfully.\n'));
      }

      console.log('File sizes after gzip:\n');
      printFileSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE
      );
      console.log();

      const appPackage = require(paths.appPackageJson);
      const publicUrl = paths.publicUrl;
      const publicPath = config.output.publicPath;
      const buildFolder = path.relative(process.cwd(), paths.appBuild);
      printHostingInstructions(
        appPackage,
        publicUrl,
        publicPath,
        buildFolder,
        useYarn
      );
    },
    err => {
      console.log(chalk.red('Failed to compile.\n'));
      printBuildError(err);
      process.exit(1);
    }
  )
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });

// Create the production build and print the deployment instructions.
function build(previousFileSizes) {
  console.log('Creating an optimized production build...');

  let compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }
        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      const resolveArgs = {
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      };
      if (writeStatsJson) {
        return bfj
          .write(paths.appBuild + '/bundle-stats.json', stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch(error => reject(new Error(error)));
      }

      return resolve(resolveArgs);
    });
  });
}

function copyPublicFolder () {
  const dir = paths.appPublic;
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    // const stat = fs.statSync(fullPath);
    const en = path.extname(fullPath);
    const bn = path.basename(file);
    if ((en === '.js' && bn !== 'entryTpl.js')) {
      fs.writeFileSync(path.join(paths.appBuild, bn), fs.readFileSync(fullPath, 'utf-8'));
    }

    // 处理 packageJson
    const pJson = JSON.parse(JSON.stringify(packageJson));
    delete pJson.dependencies;
    delete pJson.scripts;
    delete pJson.eslintConfig;
    delete pJson.browserslist;
    delete pJson.devDependencies;
    delete pJson.jest;
    delete pJson.babel;
    fs.writeFileSync(path.join(paths.appBuild, 'package.json'), JSON.stringify(pJson));
  });

  let externalList = []
  try {
    const whiteList = JSON.parse(fs.readFileSync(paths._tmpWhiteList, 'utf8'))
    Object.keys(whiteList).forEach(key => {
      if (whiteList[key].use === 0) return
      if (!whiteList[key].name) return
      // 对html写入公共包script标签
      externalList.push({
        rootname: whiteList[key].rootname,
        name: whiteList[key].name,
        url: whiteList[key].name.replace('@kg_','') + '.min.js',
        type: 'public',
        moduleName: whiteList[key].name.replace('@kg_','') + '.min.js',
        version: whiteList[key].version
      })
    })
  } catch(e) {
    console.log(e)
  }
  // TODO: 还没有把公共包的构建打通，这里只列出需要插入的公共包列表
  console.log('需要插入的公共包', externalList)

  fs.readdirSync(paths.appBuild).forEach((file) => {
    const fullPath = path.join(paths.appBuild, file);
    const bacPath = path.join(paths.appBuild, file.replace('.html', '.bac'));
    const en = path.extname(fullPath);
    // const bn = path.basename(file);
    if (en === '.html') {
      let data = fs.readFileSync(fullPath, 'utf-8');
      fs.writeFileSync(bacPath, data);
      let scriptIndex = 0
      // 插入公共包js
      let publicJs = {};
      const externalListScript = externalList.map((item, index) => {
        let url = '/vpublic/' + item.moduleName;
        publicJs[item.moduleName.replace(".min.js", "")] = item;
        // 新增 onload 监听，打印：console.warn(`script_loaded:${文件名}`)
        return `<script type="text/javascript" src="${url}" onload="console.warn('script_loaded:${item.moduleName}')"></script>`
        // return `<script type="text/javascript" src="${url}"></script>`
      }).join('')

      //获取html中的所有的script标签
      let scriptList = data.match(/<script .*?src=\"(.+?)\"[^>]*><\/script>/g);
      console.log('scriptList: ', scriptList)
      //在 html 最前面插入：console.warn(`script_total：${total}`)
      let scriptTotal = scriptList ? (scriptList.length + externalList.length) : externalList.length;
      data = data.replace(/<head>/, `<head><script>console.warn('script_total：${scriptTotal}')</script>`);
      scriptList && scriptList.forEach((item, index) => {
        let src = item.match(/src="(.+?)"/)[1];
        if (src.indexOf('/static/') > -1) {
          let chunkPath = path.join(paths.appBuild, src);
          let chunkData = fs.readFileSync(chunkPath, 'utf-8');
          // 在chunk文件的末尾追加打印
          let newChunkData = chunkData + `console.warn('script_loaded: ${src.replace('./static/js/', '')}');`;
          fs.writeFileSync(chunkPath, newChunkData);
          let newHash = require('crypto').createHash('md5').update(newChunkData).digest('hex');
          let newSrc = src + '?fg=' + newHash.slice(0,8);
          data = data.replace(src, newSrc);
        }
      })

      data = data.replace(/<script .*?src=\"(.+?)\"[^>]*><\/script>/g, function (m, n, p) {
        let newSrc = n;
        let type = 'normal';
        let moduleName = '';

        // 在script的最开始插入 -- 可能定义不恰当
        const insertScript = scriptIndex === 0 ? externalListScript : ''
        scriptIndex = scriptIndex + 1;

        if (n.indexOf('http') !== 0 && n.indexOf('/static/') < 0) {
          // 默认的js
          return insertScript + m;
        } else if (n.indexOf('http') !== 0) {
          const urlArr = n.split('/');
          const fileName = urlArr[urlArr.length - 1];
          const fileArr = fileName.split('_');
          fileArr.pop();
          let url = ''
          if (fileArr[0] === '@kg') {
            type = 'isKg';
            moduleName = fileName
            // url = '../voo_kugou/' + moduleName
            url =  n
          } else if (fileArr[0] === '@vendor') {
            type = 'isVendor';
            moduleName = fileArr.join('_');
            url = '/vo-activity/voo_kugou/' + moduleName + '.js';
          } else {
            moduleName = n.replace('./', '');
            url =  n
          }
          return insertScript + `<script type="text/javascript" src="${url}"></script>`
        } else {
          return insertScript + m;
        }
      });

      fs.writeFileSync(fullPath, data);
    }
  })
}

// function copyPublicFolder() {
//   fs.copySync(paths.appPublic, paths.appBuild, {
//     dereference: true,
//     filter: file => file !== paths.appHtml && file !== paths.appEntry,
//   });
// }
