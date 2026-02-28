import KGRequest from '@kugou/request';
import { baseInfo } from '../../utils/util';

const fxRequest = async (options) => {
    const userBaseInfo = await baseInfo()
    // 规范： http://wiki.kugou.net/pages/viewpage.action?pageId=25156183
    const params = {
        std_plat: +userBaseInfo?.appid === 1000 ? 6 : 5,
        std_nplat: 0,
        version: userBaseInfo?.clientver,
        ...(options?.params || {}),
    }
    const headers = [
        { 'X-Auth-Uid': userBaseInfo?.userid || 0 },
        { 'X-Auth-Token-Type': userBaseInfo?.appid },
        { 'X-Auth-Ticket': userBaseInfo?.token || '' },
        { 'X-Auth-App-ID': "kugou" },
        { 'Content-Type': "application/json" },
        ...(options?.headers || []),
    ]
    const requestOptions = {
        // TODO 正式服还得改改
        // https://fx.service.kugou.com 
        // https://fxapi.test.tmeoa.com'
        baseURL: 'https://fx.service.kugou.com',
        isGateway: false,
        ...options,
        headers,
        params,
    }
    return KGRequest(requestOptions)
}


//https://doc.weixin.qq.com/doc/w3_AQ8A5QahACQCN0UiJwShSR0CvVwbV?scode=AOYA2wdwAA8V0Mil89&version=5.0.3.6005&platform=win
export async function getDigInfo() {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'GET',
        url: '/kugoupet/activity/digInfo',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token
        }
    });
    return res;
}

// https://doc.weixin.qq.com/doc/w3_AQ8A5QahACQCN0UiJwShSR0CvVwbV?scode=AOYA2wdwAA8V0Mil89&version=5.0.3.6005&platform=win
// gridId 格子id 0 ~ 53
export async function openDig(gridId = 0) {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/digGridOpen',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            gridId
        }
    });
    return res;
}

export async function taskReward(taskId = 0) {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/digTaskReward',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            taskId
        }
    });
    return res;
}

export async function DigTaskComplete(taskId = 0) {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/digTaskComplete',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            taskId
            }
    });
    return res;
}
// https://doc.weixin.qq.com/doc/w3_AQ8A5QahACQCN0UiJwShSR0CvVwbV?scode=AOYA2wdwAA8V0Mil89&version=5.0.3.6005&platform=win
export async function getDigRewardList() {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'GET',
        url: '/kugoupet/activity/digRewardList',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token
        }
    });
    return res;
}

const fxRequest1 = async (options) => {
    const userBaseInfo = await baseInfo()
    // 规范： http://wiki.kugou.net/pages/viewpage.action?pageId=25156183
    const params = {
        std_plat: +userBaseInfo?.appid === 1000 ? 6 : 5,
        std_nplat: 0,
        version: userBaseInfo?.clientver,
        ...(options?.params || {}),
    }
    const headers = [
        { 'X-Auth-Uid': userBaseInfo?.userid || 0 },
        { 'X-Auth-Token-Type': userBaseInfo?.appid },
        { 'X-Auth-Ticket': userBaseInfo?.token || '' },
        { 'X-Auth-App-ID': "kugou" },
        { 'Content-Type': "application/json" },
        ...(options?.headers || []),
    ]
    const requestOptions = {
        // TODO 正式服还得改改
        baseURL: 'https://fx.service.kugou.com',
        isGateway: false,
        ...options,
        headers,
        params,
    }
    return KGRequest(requestOptions)
}

export async function getPetChatInfoCore() {
    try {
        // 发起GET请求，调用酷狗宠物公开接口获取聊天信息
        const res = await fxRequest1({
            method: 'get',
            url: '/kugoupet/public/chatInfo',
            isAllowKGAntiBush: false,
            isAllowSign: false,
            useMobileCall: false,
            timeout: 5000,
            isGateway: false,
            log: false
        });

        // 接口返回格式校验：code=0（成功）且有数据，返回数据
        const isSuccess = res?.data?.code === 0 && res?.data?.data;
        if (isSuccess) {
            return [res.data.data, null];
        } else {
            return [null, res?.data || res];
        }
    } catch (err) {
        return [null, err];
    }
}

// /**
//  * @typedef {Object} SubmitTaskData
//  * @property {Object} data - 任务提交结果数据
//  */

// /**
//  * @typedef {Object} SubmitTaskResponse
//  * @property {number} status - 请求状态。0：失败；1：成功
//  * @property {number} errcode - 错误码
//  * @property {string} errmsg - 错误信息
//  * @property {SubmitTaskData} data - 任务提交结果数据
//  */

// /**
//  * 完成任务上报
//  * @description 测试环境: 10.17.8.33 activity.mobile.kugou.com, 预发布环境: 10.16.4.149 activity.mobile.kugou.com
//  * @param {Object} params - 请求参数
//  * @param {number} params.taskid - 任务ID
//  * @param {number} params.activity_id - 活动ID
//  * @returns {Promise<SubmitTaskResponse>} 返回任务提交结果
//  */
// export async function submitTask(params) {
//     const initBaseInfo = await baseInfo();

//     const queryParams = {
//         appid: initBaseInfo.appid,
//         clientver: initBaseInfo.clientver,
//         clienttime: Date.now().toString(),
//         mid: initBaseInfo.mid,
//         uuid: initBaseInfo.uuid,
//         dfid: initBaseInfo.dfid,
//         userid: initBaseInfo.userid,
//         token: initBaseInfo.token
//     };

//     const postData = {
//         taskid: params.taskid,
//         activity_id: params.activity_id
//     };

//     return new Promise((resolve, reject) => {
//         KGRequest({
//             isAllowKGAntiBush: false,
//             isAllowSign: true,
//             sign: 'h5',
//             useMobileCall: LightMobileCall.isInClient(),
//             method: 'post',
//             params: queryParams,
//             data: postData,
//             baseURL: 'https://theme.activity.kugou.com',
//             url: '/v1/theme_act_task/submit',
//             timeout: 10000,
//             isGateway: true,
//             headers: [{
//                 'Content-Type': 'application/json',
//             }]
//         }).then((res_msg) => {
//             resolve(res_msg);
//         }).catch((err) => {
//             reject(err);
//         });
//     });
// }

// export async function getThemeActTaskStatus(params) {
//     const initBaseInfo = await baseInfo();

//     const queryParams = {
//         appid: initBaseInfo.appid,
//         clientver: initBaseInfo.clientver,
//         clienttime: Date.now().toString(),
//         mid: initBaseInfo.mid,
//         uuid: initBaseInfo.uuid,
//         dfid: initBaseInfo.dfid,
//         userid: initBaseInfo.userid,
//         token: initBaseInfo.token
//     };

//     return new Promise((resolve, reject) => {
//         KGRequest({
//             isAllowKGAntiBush: false,
//             isAllowSign: true,
//             sign: 'h5',
//             useMobileCall: LightMobileCall.isInClient(),
//             method: 'get',
//             params: queryParams,
//             baseURL: 'https://theme.activity.kugou.com',
//             url: '/v1/theme_act_task/submit',
//             timeout: 10000,
//             isGateway: true,
//         }).then((res_msg) => {
//             resolve(res_msg);
//         }).catch((err) => {
//             reject(err);
//         });
//     });
// };

// export async function getNewTaskConfig(params) {
//     const initBaseInfo = await baseInfo();

//     const queryParams = {
//         appid: initBaseInfo.appid,
//         clientver: initBaseInfo.clientver,
//         clienttime: Date.now().toString(),
//         mid: initBaseInfo.mid,
//         uuid: initBaseInfo.uuid,
//         dfid: initBaseInfo.dfid,
//         userid: initBaseInfo.userid,
//         token: initBaseInfo.token
//     };

//     return new Promise((resolve, reject) => {
//         KGRequest({
//             isAllowKGAntiBush: false,
//             isAllowSign: true,
//             sign: 'h5',
//             useMobileCall: LightMobileCall.isInClient(),
//             method: 'get',
//             params: queryParams,
//             baseURL: '',
//             url: '',
//             timeout: 10000,
//             isGateway: true,
//         }).then((res_msg) => {
//             resolve(res_msg);
//         }).catch((err) => {
//             reject(err);
//         });
//     });
// };


