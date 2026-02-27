
// 判断环境
export const getEnv = ()=>{
  // if(['localhost','test.kugou.com'].indexOf(window.location.hostname) > -1){
  //   return 'local'
  // }
  // if(['10.16.4.19'].indexOf(window.location.hostname) > -1){
  //   return 'dev'
  // }
  // return 'prod'

  // 只判断activity正式环境,其他都是测试环境
   if(['activity.kugou.com'].indexOf(window.location.hostname) > -1){
    return 'prod'
  }
  return 'dev'
}


const websocketHostConfig = {
  'local': 'ws://127.0.0.1:9098',
  'dev': 'ws://10.16.4.19:9098',
  'prod': 'wss://voos.kugou.com:9099'
}
// let websocketHost = 'ws://10.16.4.19:9098';

const env = getEnv()
export const WEBSOCKET_HOST = websocketHostConfig[env];


//发送埋点信息给voo平台
const P2D_SEND_BI_TO_VOO = 2;
//通知voo平台，切换到对应的埋点编辑
const P2D_INFORM_VOO_EDIT_BI = 3;
export const BiwsType = {
  P2D_SEND_BI_TO_VOO,
  P2D_INFORM_VOO_EDIT_BI
}