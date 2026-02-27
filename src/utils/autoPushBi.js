 import { getEnv, BiwsType } from './constants'
 import mobileLog from '../utils/mobileLog'
 const isDev = getEnv() === 'dev'
 
 /**
  * 预埋点公共方法
  * @param {string} id 必传,唯一id ，形如page1_addBtn_click,id需保持当前页面唯一
  * @param {string} name 必传,唯一id的别名 ，首页_添加按钮_点击
  * @param {object} options 额外参数 
  * @returns 
  */
 const Voo_webSocketSend = window.Voo_webSocketSend
 export default function AutoPushBi(id, name, options){
    if(!id || !name){
      console.error('AutoPushBi方法需传递id和name,请检查你的参数')
      return
    }


    // voo平台注入的bi打点配置对象 
   const _REJECT_BICONFIG =  window._BI_CONFIG ? window._BI_CONFIG : {}
   const _rejectBiConfig = _REJECT_BICONFIG[id];
 
   // 非测试环境
   if(!isDev){
     if(_rejectBiConfig && _rejectBiConfig.a){
       const biStatParams = resolveBiStatParams(_rejectBiConfig, options)
       mobileLog(biStatParams); 
     }
     return
   }
 
   
   let BIdata = resolveBiWSParams(id, name, options)
   if(_rejectBiConfig && _rejectBiConfig.a){
      const biStatParams = resolveBiStatParams(_rejectBiConfig, options);
      mobileLog(biStatParams, (biContent) =>{
        Voo_webSocketSend && Voo_webSocketSend(
          BiwsType.P2D_SEND_BI_TO_VOO, {
              ...biContent, 
              id
          }, id, BIdata); 
      }); 
     
      return
   }

  // 发送消息给平台，展示未配置埋点列表
  Voo_webSocketSend && Voo_webSocketSend( 
      BiwsType.P2D_INFORM_VOO_EDIT_BI, {
      id, 
      name: name || _rejectBiConfig.name
    }, id, BIdata); 
 }
 
 
//  拼接模版上报r的后缀规则
 function resolveR(r){ 
  let actId = '';
  if(window._VO_ACT_ID_ && window._VO_ACT_ID_.indexOf('-') >= 0){
    actId = `${window._VO_ACT_ID_.split('-')[0]}`;
    r += `_${actId}`;
  }
  return r;
}

 /**
  * 组装配置里面选中的svar参数key 和 真实运行中的存在的key匹配
 */
 function resolveBiStatParams(biConfig, runtimeParams) {
    const biStatParams = {
      a: biConfig.a,
      b: biConfig.b,
      ft: biConfig.ft,
      r: resolveR(biConfig.r)
    }
    //  组装自定义参数
    if(biConfig.selectSvars && Object.keys(biConfig.selectSvars).length){
      for(let s in biConfig.selectSvars){ 
          let sval = biConfig.selectSvars[s];
          if(runtimeParams.hasOwnProperty(sval)){
              biStatParams[`svar${Number(s)+1}`] = runtimeParams[sval]
            }
      }
    }
    // fo不是必填的
    if(biConfig.fo){
      biStatParams.fo = biConfig.fo
    }
    // 新增参数,旧项目没有
    if (biConfig.business_name !== null && biConfig.business_name !== void 0) {
      biStatParams.business_name = biConfig.business_name;
    }
    if (biConfig.is_acquire_users !== null && biConfig.is_acquire_users !== void 0) {
      biStatParams.is_acquire_users = biConfig.is_acquire_users;
    }
    // hreffrom 默认从url上获取参数
    if(biConfig.hreffrom){
      if(biConfig.hreffrom === 'URL'){
        biStatParams.hreffrom = getQueryVariable('hreffrom') || ''
      }else if(biConfig.hreffrom === 'ID'){
        biStatParams.hreffrom =  window._VO_ACT_ID_ || ''
      }else{
        biStatParams.hreffrom= biConfig.hreffrom
      }
    }

    // channel 默认从url上获取参数
    if(biConfig.channel){
      if(biConfig.channel === 'URL'){
        biStatParams.channel = getQueryVariable('channel') || ''
      }else if(biConfig.channel === 'ID'){
        biStatParams.channel =  window._VO_ACT_ID_ || ''
      }else{
        biStatParams.channel = biConfig.channel
      }
    }

    return biStatParams

 }

// 组装通过ws链接发送消息的数据结构
function resolveBiWSParams(id,name,options) {
  const _biData = {
      id, 
      name
  }

  if(options && Object.keys(options).length){
      _biData.svars = []
      for (const key in options) {
          _biData.svars.push(key)
      }
  }

  return _biData
 }


function getQueryVariable (name) {
  const url = window.location.href;
  let reg = new RegExp('[?&]' + name + '=([^&#]+)');
  let query = url.match(reg);
  return query ? query[1] : null;
}