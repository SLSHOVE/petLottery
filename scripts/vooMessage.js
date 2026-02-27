

const fs = require('fs-extra');
const paths = require('../config/paths');
const axios = require('axios');

/**
 * 通知voo
 * @params apiUrl
 * */
function fetchVooPushApi(apiUrl, params) {
  let url = `${apiUrl}?modulename=${params.modulename}&version=${params.version}`
  if(params.type){
    url += `&type=${params.type}`
  }
  url += `&domain=${params.domain}`;


  return new Promise((resolve, reject) => {

    axios.get(url).then(response => {
      if(response && response.data && response.data.code === '0000'){
        console.log(url+"成功通知voo服务端当前组件版本更新");
        resolve(true)
      }else{
        console.log(url+"通知voo服务端当前组件版本失败");

        resolve(false)
      }
    })
    .catch(error => {
      // console.log(error);
      resolve(false)
    });
  })

}


/**
 * 检查网络文件是否存在, response.status === 200 就表示存在
 * @parmas sourceFile 需要检查的源文件路径
 * @return true|false
 * */
function checkFileisExist(sourceFile){
  return new Promise((resolve, reject) => {
    axios.get(sourceFile).then(response => {
      if(response && response.status === 200) {
        resolve(true)
      }else{
        resolve(false)
      }
    }).catch((err) => {
      resolve(false)
    })
  })
}


async function onSendMessageToVoo(name, version, type, domain = 'activity.kugou.com_public_module') {
  return new Promise(async (resolve, reject)=>{
    if(name && version) {
      let sourceFile = `https://activity.kugou.com/vpublic/${name}_${version}.min.js`
      let sourceFile2 = `https://h5.kugou.com/vpublic/${name}_${version}.min.js`
      let isExitFile  = await checkFileisExist(sourceFile);
      let isExitFile2  = await checkFileisExist(sourceFile2);
      if(isExitFile && isExitFile2) {
        // console.log('stdout: '+ sourceFile + " 存在, 无需通知voo");
        resolve(true)
        return
      }

      let apiUrl = `http://voo.kugou.net/public/pushVooPublicResource`
      const params = {
        modulename: name.replace('@kg_',''),
        version: version,
      }
      params.domain = domain
      if(type){
        params.type = type
      }
      const res = await fetchVooPushApi(apiUrl, params)
      resolve(res)
    }
  })
}

function sendMessageToVoo(){
  return new Promise(async (resolve, reject) => {
    try {
      const whiteList = JSON.parse(fs.readFileSync(paths._tmpWhiteList, 'utf8'))
      // 白名单当中的组件通知voo更新对应版本
      let fetchPromisePre = []

      Object.keys(whiteList).forEach(key => {
        if (whiteList[key].use === 0) return

        // 需要同时通知到预发布和线上环境
        fetchPromisePre.push(onSendMessageToVoo(key.replace('@kugou/',''), whiteList[key].version, null, 'h5.kugou.com_public_module'))
        fetchPromisePre.push(onSendMessageToVoo(key.replace('@kugou/',''), whiteList[key].version))
      })

      // 通知预发布
      console.log('开始通知预发布环境')
      const preResponse = await Promise.all(fetchPromisePre)
      console.log('preResponse', preResponse)
      let successNum = preResponse.filter(result => result === true)
      // 全部通知完毕
      if(fetchPromisePre.length === successNum.length){
        // 通知线上

        console.log('开始通知线上环境')

        let fetchPromise = []
        Object.keys(whiteList).forEach(key => {
          if (whiteList[key].use === 0) return

          // 需要同时通知到预发布和线上环境
          fetchPromise.push(onSendMessageToVoo(key.replace('@kugou/',''), whiteList[key].version, 'prd', 'h5.kugou.com_public_module'))
          fetchPromise.push(onSendMessageToVoo(key.replace('@kugou/',''), whiteList[key].version, 'prd'))
        })

        const prdResponse = await Promise.all(fetchPromise)
        successNum = prdResponse.filter(result => result === true)
        // 全部通知完毕
        console.log('prdResponse', prdResponse)
        if(fetchPromise.length === successNum.length){
          resolve(true)
        }else{
          resolve(false)
        }
      }else{
        resolve(false)
      }
    } catch(e) {
      console.log(e)
    }
  })

}
// 验证逻辑是否走通
// async function init(){
//   const resMessage = await sendMessageToVoo()
//   console.log('resMessage', resMessage)
// }
// init()

module.exports = sendMessageToVoo
