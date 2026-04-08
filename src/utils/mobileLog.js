import LightMobileCall from "@kugou/light-mobilecall"
import getBaseInfo from "@kugou/get-base-info"
import { getQueryVariable } from '../utils/common';

import kgStatObj from "@kugou/stat";
const kgStatPush = kgStatObj.kgStatPush;


/**
 * 预留暴露window.__BI_CONFIG_APPID 
 * 允许业务方自定义bi上报时候的appid  - 针对不同独立app
 * appid规则为优先使用__BI_CONFIG_APPID，否则判断端内使用端内自己的appid，否则默认1058
*/
let userInfo = {};
function initCommon(){
  return new Promise((resolve, reject)=>{
    if(!userInfo.kugouID){
      let appid = window.__BI_CONFIG_APPID ? Number(window.__BI_CONFIG_APPID) : (LightMobileCall.isInClient() ? null : 1058) // 1058 默认h5活动页面
      getBaseInfo(appid, function(res){
        console.log('getBaseInfo', res)
        userInfo = {
          kugouID: res.userid,
          mid: res.mid,
          uuid: res.uuid,
          appid: res.appid,
          version: res.clientver,
          dfid: res.dfid,
        }
        resolve(userInfo)
      });
    }
  })
}
initCommon()


export default async function mobileLog (biData, callback) {
  let data = {...biData}
  // 如果调用的时候还没有回来
  if(!userInfo.mid){
    userInfo = await initCommon()
  }
  let fn = function () {
    data.uuid =  (userInfo && userInfo.uuid) || 0;
    data.mid =  (userInfo && userInfo.mid) || 0;
    data.userid = (userInfo && userInfo.kugouID) || 0;
    data.appid = (userInfo && userInfo.appid) || 0;
    data.tv = (userInfo && userInfo.version) || 0;
    data.timestamp = Math.round(new Date().getTime() / 1000);
    // data.hreffrom = window._VO_ACT_ID_ || ''
    data.hreffrom = getQueryVariable('hreffrom') || window._VO_ACT_ID_ || ''
    // data.dfid = (userInfo && userInfo.dfid) || 0; - 不需要上报dfid的
    console.log('埋点采集data',data)
    // 上报2：bi
    kgStatPush(data, 2);

    // 上报之后执行回调
    callback && callback(data)
  }
  fn();
}
