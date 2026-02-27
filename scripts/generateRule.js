const {join, basename} = require('path');
const fs = require('fs');
const propTypes = {
  object: "K_object_K",
  string: "K_string_K",
  number: "K_number_K",
  img: "K_img_K",
  boolean: "K_boolean_K",
  array: "K_array_K"
};
const keyTransformMark = {
  "K_name": "name",
  "K_type": "type",
  "K_children": "children"
};
const request = require('request');
const { exec } = require('child_process');


function sh (commend, cwd='./') {
  return new Promise(function(resolve) {
    exec(commend, { cwd: cwd }, function (err, stdout, stderr) {
      if(err) {
        console.log(err);
        resolve({
          code: -1,
          msg: JSON.stringify(err)
        });
      } else {
        console.log(`stdout: ${stdout}`);
        resolve({
          code: 1,
          stdout
        })
      }
    })
  })
}

/**
 * 发起请求
 * @param options
 * @returns {Promise<any>}
 */
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
        console.log(e);
        resolve({
          success: -1
        });
      }
    });
  });
};

/**
 * 获取所有 data.js 结尾的 KEY
 */
function getData() {
  const entries = {};
  const dir = join(__dirname, '..', 'src/config');
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = join(dir, file);
    const stat = fs.statSync(fullPath);
    const bn = basename(file);

    if (stat.isFile() && bn.indexOf("data.js") !== -1) {
      entries[bn.split('.')[0]] = fullPath;
    }
  });
  return entries;
}

const entries = getData();

/**
 * 翻译 key 值
 * @param dk
 * @returns {Promise<void | string | *>}
 */
async function getTranslateName (dk) {
  var reg = new RegExp('(?=(?!^)[A-Z])');
  dk = dk.replace(new RegExp(reg, 'g'), " ");
  let name = dk;
  return name
}

/**
 * 递归生成需要的 rule 结构
 * @param data
 * @param rule
 * @returns {Promise<void>}
 */
async function rewriteRule(data, rule = {}) {
  if (typeof data !== "object") {
    console.error("数据结构错误");
    return
  }

  if (Array.isArray(data)) {
    let toRecursion = data[0];

    if (typeof toRecursion !== "object") {
      let name = await getTranslateName(toRecursion);
      let type = typeof data[toRecursion];
      if (type === "string") {
        if (data[toRecursion].indexOf("http") !== -1 && (data[toRecursion].indexOf("png") !== -1 || data[toRecursion].indexOf("jpg") !== -1 || data[toRecursion].indexOf("jpeg") !== -1)) {
          type = "img"
        }
      }

      rule = {
        K_name: name,
        K_type: propTypes[type]
      };
      return rule
    }

    rule = {
      K_type: Array.isArray(toRecursion) ? propTypes.array : propTypes.object,
      K_children: await rewriteRule(toRecursion)
    };
    return rule
  }

  for (let dk in data) {
    keyTransformMark[`K_${dk}`] = dk;
    if (typeof data[dk] === "object") {
      let name = await getTranslateName(dk);
      if (Array.isArray(data[dk])) {
        rule[`K_${dk}`] = {
          K_name: name,
          K_type: propTypes.array,
          K_children: await rewriteRule(data[dk])
        };
        continue;
      }
      rule[`K_${dk}`] = {
        K_name: name,
        K_type: propTypes.object,
        K_children: await rewriteRule(data[dk])
      }


    } else {
      let name = await getTranslateName(dk);
      let type = typeof data[dk];
      if (type === "string") {
        if (data[dk].indexOf("http") !== -1 && (data[dk].indexOf("png") !== -1 || data[dk].indexOf("jpg") !== -1 || data[dk].indexOf("jpeg") !== -1)) {
          type = "img"
        }
      }

      rule[`K_${dk}`] = {
        K_name: name,
        K_type: propTypes[type]
      }
    }
  }
  return rule
}

/**
 * 写 rule 文件，按照约定提交其中 K 字头。
 * @param k
 * @returns {Promise<void>}
 */
async function writeFile (k) {
  let data = require(`../src/config/${k}.data.js`);
  let res = await rewriteRule(data);
  const path = join(__dirname, '../src/', 'config');

  let _jsonRes = JSON.stringify(res);

  for (let _k in keyTransformMark) {
    let trk = '"' + _k + '"';
    _jsonRes = _jsonRes.replace(new RegExp(trk,'g'), keyTransformMark[_k])
  }

  for (let _k in propTypes) {
    let trk = '"' + propTypes[_k] + '"';
    _jsonRes = _jsonRes.replace(new RegExp(trk,'g'), `propTypes.${_k}`)
  }

  await fs.writeFileSync(`${path}/${k}.rule.js`, `const propTypes = require('@kugou/voo-prop-types');module.exports = ${_jsonRes}`);

  let beautify_res = await sh(`js-beautify -q ${path}/${k}.rule.js`);

  await fs.writeFileSync(`${path}/${k}.rule.js`, beautify_res.stdout);
  console.log('\x1B[36m%s\x1b[39m', `生成文件: ${k}.rule.js 完成！！！` );
}

console.log('\x1B[43m%s\x1B[49m', "【voo数据模版生成】");
console.log('\x1B[35m%s\x1b[39m', "执行该选项将会根据 data.js 中的内容重置对应的 rule.js，是否执行全部生成 (Y/N) : ");

/**
 * 交互模块
 */
process.stdin.setEncoding('utf8');
let timer = 0;
process.stdin.on('readable', async () => {
  timer++;
  let ans = process.stdin.read();
  ans = ans.replace('\n', '').trim();
  if (timer >= 2 && Object.keys(entries).indexOf(ans) !== -1) {
    await writeFile(ans);
    process.exit();
    return
  }

  if ((ans.indexOf("Y") !== -1 || ans.indexOf("y") !== -1) && timer === 1) {
    for (let k in entries) {
      await writeFile(k)
    }
    process.exit();
  }

  if (timer === 1) {
    console.log('\x1B[35m%s\x1b[39m', `[${Object.keys(entries).join("，")}] 中选取对应键值，进行 rule 重置:`);
    process.stdin.read();
  } else {
    console.log('\x1B[31m%s\x1b[39m', "!!!!!!! 未选值或选值错误，退出");
    process.exit();
  }
});

