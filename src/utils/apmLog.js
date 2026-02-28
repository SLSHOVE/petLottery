// import { LightMobileCall } from '../adapters/api/index';
import LightMobileCall from '@kugou/light-mobilecall';
import kgStatObj from "@kugou/stat";
const kgStatPush = kgStatObj.kgStatPush;
const notifyToStartReporting = kgStatObj.notifyToStartReporting;

const FANXID = 'TempUserid';

// APM上报
let apmInfo = {};
export async function apmLog(data) {
  let res = {};
  if (LightMobileCall.isInClient() && !apmInfo.got) {
    apmInfo.got = 1;
    res = await new Promise((resolve, reject) => {
      LightMobileCall.mobileCall(101, null, function (res1) {
        LightMobileCall.mobileCall(122, null, function (res) {
          resolve(Object.assign({}, res, res1));
        });
      });
    });
    apmInfo = Object.assign(apmInfo, res);
  } else if (!LightMobileCall.isInClient() && !apmInfo.got) {
    let _userInfo = {
      kugouID: getCookie('KuGoo', 'KugooID') || 0,
      nickName: getCookie('KuGoo', 'NickName') || '',
      token: getCookie('KuGoo', 't') || '',
      appid: getCookie('KuGoo', 'a_id') || 1058,
      photo: getCookie('KuGoo', 'Pic') || '',
      dfid: getCookie('kg_dfid') || '-',
      mid: getCookie('kg_mid ') || 0,
    };
    res = _userInfo;
    apmInfo = Object.assign(apmInfo, res);
  }
  const ver = apmInfo.version || '';
  const appid = apmInfo.appid || 1058;
  const kugouID = apmInfo.kugouID || '';

  var fn = function () {
    data = data || {};
    data.typeid = data.typeid;
    data.para = data.para;
    data.ver = ver;
    data.timestamp = Math.round(new Date().getTime() / 1000);
    data.useragent = navigator.userAgent;
    data.fanxid = getFanxid(Number(kugouID));
    data.os = data.os || appid || 1058; // ios：1000，android：1005，ipad：1012

    kgStatPush(data, 1);
    notifyToStartReporting();
  };
  fn();
}

/**
 * 生成随机数
 * @param {Number} max
 * @param {Number} min
 */
function getRandomNumber(max, min) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 获取 kugouid，不存在则生成唯一id
 * @param {Number} kugouID
 */
function getFanxid(kugouID) {
  let fanxid = 0;
  if (kugouID) {
    fanxid = kugouID;
  } else {
    if (localStorage.getItem(FANXID)) {
      fanxid = localStorage.getItem(FANXID);
    } else {
      fanxid = Math.round(new Date().getTime() / 1000) + '' + getRandomNumber(0, 99) + '';
      localStorage.setItem(FANXID, fanxid);
    }
  }
  return fanxid;
}

function parseParams(str) {
  const obj = {};
  const arr = str.split('&');
  for (let i = 0; i < arr.length; i++) {
    const temp = arr[i].split('=');
    obj[temp[0]] = temp[1];
  }
  return obj;
}

function getCookie(name, key, isJSON) {
  let cookieValue = '';
  const arrStr = document.cookie.split('; ');
  for (let i = 0; i < arrStr.length; i++) {
    const temp = arrStr[i].match(/^(\w+)=(.+)$/);
    if (temp && temp.length > 1 && temp[1] === name) {
      cookieValue = temp[2];
      break;
    }
  }
  if (key) {
    if (!isJSON) return parseParams(cookieValue)[key];
    else return JSON.parse(cookieValue)[key];
  }
  return cookieValue;
}

export function formatError(error) {
  // 将 error 转换为字符串，处理 Error 对象无法被 JSON.stringify 序列化的问题
  let errorString = '';
  if (error instanceof Error) {
    // Error 对象：提取 message、stack、name 等关键信息
    errorString = JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause && { cause: error.cause }),
      ...(error.code && { code: error.code })
    });
  } else if (typeof error === 'object' && error !== null) {
    // 普通对象：尝试 JSON.stringify
    try {
      errorString = JSON.stringify(error);
    } catch (e) {
      errorString = String(error);
    }
  } else {
    // 其他类型：直接转换为字符串
    errorString = String(error);
  }

  return errorString;
}
