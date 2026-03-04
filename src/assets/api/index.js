import KGRequest from '@kugou/request';
import { baseInfo } from '../../utils/util';

// 通用请求函数（保留，抽奖接口复用）
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
        // TODO 正式服替换为：https://fx.service.kugou.com
        // 测试服：https://fxapi.test.tmeoa.com
        baseURL: 'https://fxapi.test.tmeoa.com',
        isGateway: false,
        ...options,
        headers,
        params,
    }
    return KGRequest(requestOptions)
}

// 宠物接口专用请求函数（保留，宠物领养检查用）
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
        // TODO 正式服替换为：https://fx.service.kugou.com
        baseURL: 'https://fx.service.kugou.com',
        isGateway: false,
        ...options,
        headers,
        params,
    }
    return KGRequest(requestOptions)
}

// ====================== 新增：抽奖相关接口（替换原挖宝接口） ======================

/**
 * 获取抽奖信息（原getDigInfo替换）
 * @method GET
 * @url /kugoupet/activity/lotteryInfo
 * @return {Promise} 响应包含：LotteryNum(抽奖次数)、startTime/endTime(活动时间)、tasks(任务列表)
 */
export async function getLotteryInfo() {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'GET',
        url: '/kugoupet/activity/lotteryInfo',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token
        }
    });
    return res;
}

/**
 * 领取抽奖任务奖励（原DigTaskComplete/taskReward替换）
 * @method POST
 * @url /kugoupet/activity/lotteryTaskReward
 * @param {number} taskId - 任务ID（必填）
 * @return {Promise} 响应包含：taskInfo(任务信息)、addLotteryNum(新增抽奖次数)、lotteryNum(当前抽奖次数)
 */
export async function lotteryTaskReward(taskId = 0) {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/lotteryTaskReward',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            taskId // 接口必填：要领取的任务ID
        }
    });
    return res;
}

/**
 * 发起抽奖（原openDig替换）
 * @method POST
 * @url /kugoupet/activity/lottery
 * @return {Promise} 响应包含：rewardId(奖励ID)、rewardType(奖励类型)、name(奖励名称)等
 */
export async function lottery() {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/lottery',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            // 接口要求请求体为空对象，此处仅传用户鉴权信息
        }
    });
    return res;
}

/**
 * 获取抽奖奖励列表
 * @method GET
 * @url /kugoupet/activity/lotteryRewardList
 * @return {Promise} 响应包含：rewardList(奖励记录列表)
 */
export async function getLotteryRewardList() {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'GET',
        url: '/kugoupet/activity/lotteryRewardList',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token
        }
    });
    return res;
}

/**
 * 任务完成上报
 * @method POST
 * @url /kugoupet/activity/lotteryTaskComplete
 * @param {number} taskId - 任务ID（必填）
 * @return {Promise} 响应包含：code(状态码)、msg(提示)、data(数据)
 */
export async function lotteryTaskComplete(taskId = 0) {
    const userBaseInfo = await baseInfo();
    const res = await fxRequest({
        method: 'POST',
        url: '/kugoupet/activity/lotteryTaskComplete',
        data: {
            userid: userBaseInfo.userid,
            token: userBaseInfo.token,
            taskId: Number(taskId) // 确保是number类型，符合接口要求
        }
    });
    return res;
}

export async function getPetChatInfoCore() {
    try {
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