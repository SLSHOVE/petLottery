const propTypes = require('@kugou/voo-prop-types');
const { join, basename } = require('path');
const fs = require('fs');

const keyTransformMark = {
  name: 'name',
  type: 'type',
  children: 'children',
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

    if (stat.isFile() && bn.indexOf('data.js') !== -1) {
      entries[bn.split('.')[0]] = fullPath;
    }
  });
  return entries;
}

/**
 * 递归 check rule 结构
 * @param data
 * @param rule
 * @returns {Promise<void>}
 */
async function rewriteRule(data, rule = {}) {
  // let rule = require(`../src/config/${k}.rule.js`)
  let toReturn = {};
  if (typeof data !== 'object') {
    console.error('数据结构错误');
    return;
  }

  if (Array.isArray(data)) {
    let toRecursion = rule.default || data[0];

    if (typeof toRecursion !== 'object') {
      let type = typeof data[toRecursion];
      toReturn = {
        name: toRecursion,
        type: propTypes[type] || 'string',
      };
      if (type === 'string') {
        if (
          (data[toRecursion].indexOf('http') !== -1 || data[toRecursion].indexOf('https') !== -1) &&
          (data[toRecursion].indexOf('png') !== -1 ||
            data[toRecursion].indexOf('jpg') !== -1 ||
            data[toRecursion].indexOf('jpeg') !== -1)
        ) {
          toReturn.type = 'img';
        }
      } else if (type === 'number') {
        toReturn.type = ['number', 'timestamp'];
      }

      return toReturn;
    }

    return {
      name: JSON.stringify(toRecursion),
      type: Array.isArray(toRecursion) ? propTypes.array : propTypes.object,
      children: await rewriteRule(toRecursion, rule.children),
    };
  }

  for (let dk in data) {
    keyTransformMark[`${dk}`] = dk;
    if (typeof data[dk] === 'object') {
      if (Array.isArray(data[dk])) {
        toReturn[`${dk}`] = {
          name: dk,
          type: propTypes.array,
          children: await rewriteRule(data[dk], rule[dk]),
        };
        continue;
      }
      toReturn[`${dk}`] = {
        name: dk,
        type: propTypes.object,
        children: await rewriteRule(data[dk]),
      };
    } else {
      let type = typeof data[dk];
      if (type === 'string') {
        if (
          (data[dk].indexOf('http') !== -1 || data[dk].indexOf('https') !== -1) &&
          (data[dk].indexOf('png') !== -1 || data[dk].indexOf('jpg') !== -1 || data[dk].indexOf('jpeg') !== -1)
        ) {
          type = 'img';
        }
      }

      toReturn[`${dk}`] = {
        name: dk,
        type: propTypes[type] || 'string',
      };

      if (type === 'number') {
        toReturn[`${dk}`].type = ['number', 'timestamp'];
      }
    }
  }
  return toReturn;
}

function ruleError(pr, r, k, res = []) {
  for (let i in pr) {
    if (!r || !r[i]) {
      if (i === 'name') {
        continue;
      } else {
        res.push(`-------------------- ${k}.rule.js 中 ${pr.name || i} 左右有 层级错误`);
      }
    } else {
      if (Array.isArray(pr[i].type) ? !~pr[i].type.indexOf(r[i].type) : pr[i].type !== r[i].type) {
        res.push(
          `-------------------- ${k}.rule.js 中 ${r[i].name} 字段，最好是 ${pr[i].type} 类型，但是你是 ${r[i].type} 类型`,
        );
        // return `-------------------- ${k}.rule.js 里面的 ${r[i].name}炸了`
      }
      if (i === 'children') {
        res = [...res, ...ruleError(pr[i], r[i], k)];
      } else {
        if (pr[i].children) {
          // console.log('--------------------');
          res = [...res, ...ruleError(pr[i].children, r[i].children, k)];
        }
      }
    }
  }
  return res;
}

async function checkRule() {
  const entries = getData();
  let tips = [];
  for (let k in entries) {
    let data = require(`../src/config/${k}.data.js`);
    let rule = require(`../src/config/${k}.rule.js`);
    let res = await rewriteRule(data, rule);
    // console.log(JSON.stringify(rule), JSON.stringify(res))

    let notthrough = ruleError(res, rule, k);
    tips = [...tips, ...notthrough];
  }
  return tips;
}

module.exports = checkRule;

if (require.main === module) {
  checkRule().then((tips) => {
    console.log('tips', tips);
  });
}
