import React, { Component } from 'react';
import '../assets/common.css';
import styles from './Index.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import Titlebar from '../components/titlebar';
import { Toast } from '@cola/Toast';
import { jumpPage, buildJupmUrl, baseInfo, callAppLogin, openLittleNest, closePage, handleSharePic} from '../utils/util'; 
import Header from '../components/Header';
import Tasks from '../components/Tasks';
import { getDigInfo, openDig, DigTaskComplete, getPetChatInfoCore} from '../assets/api';
import DailyLoginModal from '../components/DailyLoginModal';
import { getGlobalEvent } from '../utils/eventEmitter';
import LightMobileCall from '@kugou/light-mobilecall';
import SharePoster from '../components/SharePoster';
import RewardModal from '../components/RewardModal';
import { prizeMap, cardMap } from '../utils/common';
import kg20EmptyLogin from '@cola/KGImage/src/assets/kg20/empty-login.js';
import {loading} from '../utils/common'
import mobileLog from "../utils/mobileLog";
import { apmLog } from '../utils/apmLog';
import share from '@kugou/share';
const eventBus = getGlobalEvent();

const DAILY_LOGIN_MODAL_KEY = 'pettreasure_daily_login_shown3';

// 获取今天的日期字符串 (YYYY-MM-DD)
const getTodayDateStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 检查今天是否已经弹过弹窗
const hasShownTodayModal = () => {
  try {
    const lastShownDate = localStorage.getItem(DAILY_LOGIN_MODAL_KEY);
    return lastShownDate === getTodayDateStr();
  } catch (e) {
    return false;
  }
};

// 记录今天已弹过弹窗
const markTodayModalShown = () => {
  try {
    localStorage.setItem(DAILY_LOGIN_MODAL_KEY, getTodayDateStr());
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const data = combineSubmodule('Index');

class Index extends Component {

  state = {
    digNum: 0, // 当前用户剩余挖宝次数
    rewardConfig: [], // 奖励配置
    taskConfig: [], // 任务配置
    grids: [], // 已经挖开的格子
    tasks: [], // 用户的任务状态
    dataInited: false,
    showDailyLoginModal: false, // 是否显示每日首次登录弹窗
    showRewardModal: false, // 是否显示奖励弹窗
    rewardModalImageWidth: '100%', // 奖励弹窗图片宽度
    rewardModalImage: '', // 奖励弹窗图片
    currentRewardId: 0, // 当前奖励ID
    rewardModalBtnText: '立即查看', // 奖励弹窗按钮文字
    rewardModalTitle: '恭喜获得「新春祝福卡」', // 奖励弹窗标题
    rewardModalSubtitle: '太棒了一级棒~', //  奖励弹窗副标题
    showEmptyImage: true,
    isLoginLoading: true,
    isTaskSubmitting: false,
    isPetCheckLoading: false,
    needRedirect: false,
    isLowVersion: null,
    isVersionForbidden: false,
    isActivityEnded: false
  }

  currentTaskInfo = {
    // taskId: '',
    // taskType: 0,
    isTaskTriggered: false // 是否触发了需要监听返回的任务
  };

  checkActivityEndByApi = (apiEndTime) => {
    if (!apiEndTime) return false; // 无endTime则不判断
    const currentTime = new Date().getTime(); // 当前时间（毫秒级）
    const endTimeNum = Number(apiEndTime); // 转数字兼容字符串/数字
    if (isNaN(endTimeNum)) return false; // 非数字容错
    const endTimeStamp = endTimeNum * 1000; // 秒转毫秒，统一单位对比
    return currentTime > endTimeStamp; 
  };

  checkPetAdoptStatus = async () => {
    if(!LightMobileCall.isInClient()) return;
    this.setState({ isPetCheckLoading: true });

    try {
      const [response] = await getPetChatInfoCore();
      if (!response) {
        throw new Error("网络异常，请稍后重试...");
      }
      apmLog({
        typeid: 111645,
        state: 1,
        para: 14,
        page: 0
      });
      const isAdopted = response?.hasAdopt === 1;
      if (!isAdopted) {
        Toast.info({ 
          content: "请先领养宠物再来挖宝吧~",
          duration: 2500 
        });
        const targetTab = 0;
        setTimeout(() => {
          openLittleNest(targetTab); 
        }, 2500);

        this.setState({ needRedirect: true });
      }

    } catch (err) {
      const getbaseInfo = await baseInfo();
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1",
        position: "03",
        fs: `${err?.code || 999}_14`,
        hash: `错误：${err.msg || err.message || '未知错误'}`,
        interfaceurl: "/kugoupet/public/chatInfo",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
    } finally {
      this.setState({ isPetCheckLoading: false });
    }
  };

  getRewardSubtitle = (rewardId) => {
    const { props } = this;
    if ([2001, 2002, 2003, 3001, 3002].includes(rewardId)) {
      return props.prizeCopywriting[`text${rewardId}`]  || '太棒了一级棒~';
    }
    if (rewardId >= 1001 && rewardId <= 1005) {
      return props.prizeCopywriting.text1001  || '太棒了一级棒~';
    }
    if (rewardId >= 4001 && rewardId <= 4005) {
      return props.prizeCopywriting.text4001 || '太棒了一级棒~';
    }
    if ([5001, 5002, 5003].includes(rewardId)) {
      return props.prizeCopywriting[`text${rewardId}`] || '太棒了一级棒~';
    }
    return props.prizeCopywriting.textDefault || '太棒了一级棒~';
  };

  transRewardConfig = (rewardConfig) => {
    this._rewardConfigMap = {};
    for (let i = 0; i < rewardConfig.length; i++) {
      const item = rewardConfig[i];
      this._rewardConfigMap[item.rewardId] = item;
    }
  }

initData = async () => {
  if (this.state.isVersionForbidden) return;
  if (this.state.isActivityEnded) return;
  const getbaseInfo = await baseInfo();
  // 先定义res，避免catch里res未赋值
  let res = null;
  if (LightMobileCall.isInClient()) {
    try {
      res = await getDigInfo();
      if (res?.data?.code === 0) {
        const data = res?.data?.data || {};
        const digNum = data.digNum || 0;
        const endTime = data.config?.endTime;
        const isActivityOver = this.checkActivityEndByApi(endTime);
        if (isActivityOver) {
          this.setState({
            isActivityEnded: true,
            isLoginLoading: false,
            showEmptyImage: true
          }, () => {
            Toast.info({ content: '活动已结束' });
            setTimeout(() => closePage(), 2500);
          })
          return;
        }
        this.setState({
          dataInited: true,
          rewardConfig: data.config?.rewardConfig || [],
          taskConfig: data.config?.taskConfig || [],
          grids: data.grids || [],
          tasks: data.tasks || [],
          digNum,
          isLoginLoading: false
        }, () => {
          this.checkAndShowDailyLoginModal();
          this.transRewardConfig(data.config?.rewardConfig || []);
        });
      apmLog({
          typeid: 111645,
          state: 1,
          para: 14,
          page: 0
        });
      } else {
        // 服务端错误code!==0）
        apmLog({
          typeid: 111645,
          state: 0,
          para: 14,
          te: "E2", 
          position: "02",
          fs: `${res?.data?.code || 999}_14`,
          hash: `错误：${res?.data?.msg || '服务端处理失败'}`,
          interfaceurl: "/kugoupet/activity/digInfo",
          realtime1: window.location.href,
          page: getbaseInfo?.userid || 0 
        });
      }
    } catch (err) {
      // 网络错误
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1", 
        position: "02",
        fs: `999_14`,
        hash: `错误：${err.msg || err.message || '网络异常，请求失败'}`,
        interfaceurl: "/kugoupet/activity/digInfo",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      this.setState({ isLoginLoading: false });  
    }
    window.vs_finish && window.vs_finish();
  }
};
  // 检查并显示每日登录弹窗
  checkAndShowDailyLoginModal = () => {
    const { digNum, dataInited, grids } = this.state;
    // 条件：当天没有弹过 && digNum >= 1 && dataInited = true
    if (dataInited && digNum >= 1 && !hasShownTodayModal() && grids.length < 54) {
      this.setState({ showDailyLoginModal: true });
      markTodayModalShown();
    }
  }

   initClientPageListener = () => {
    LightMobileCall.KgWebMobileCall("KgWebMobileCall.shareStatus", (res) => {
      try {
        res = JSON.parse(res);
      } catch (error) {}
     console.log("shareStatus" ,res)
      
     
      // 有记录标记， 又触发了分享回调返回1，就是分享成功
      if (window.isClickShareBtn === 1 && Number(res.status) === 1) {
        eventBus.emit('titleBarShareSuccess'); 
         console.log("shareStatus" ,res?.status)
      }
    })
  };
  
  componentDidMount () {
    const shareConfig = this.props.sharePosterConfig || {};
    console.log("【页面初始化】传入的配置：", shareConfig)
    handleSharePic({
          useSharePic: this.props.useSharePic || '', 
          defaultShareConfig: this.props.sharePosterConfig || {},

          onStatusChange: (status) => {
            this.setState({ sharePicStatus: status });
          }
        });


    loading.show();
    LightMobileCall.mobileCall(128, { state: 0 })
    LightMobileCall.mobileCall(1369, {type: 0});
    this.initData();
    this.initClientPageListener();
    this.checkLoginStatus();
    document.addEventListener('visibilitychange', this.handleBrowserVisibilityChange);
    window._kg_opendata_ = {
      page: "活动页",
      activityName: "养狗春节挖宝" || document.title,
      activityId: "" || window._VO_ACT_ID_,
      codeSystem: "voo",
      channel: "",
    }
    if (window._kg_openkugouapp_pageExposeReported_fun_) {
      window._kg_openkugouapp_pageExposeReported_fun_();
    }

    mobileLog({
          a: 23320002,
          b: '曝光',
          ft: '春节挖宝各页面',
          r: '养狗',
          svar1: '1'
        });
    apmLog({
      typeid: 111645,
      state: 1,
      para: 14,
      realtime1: window.location.href,
      page: 0
    });

    eventBus.on('refresh', () => {
      this.initData();
      console.log(12345)
    });

    eventBus.on('taskTriggered', (taskInfo) => {
      // console.log('父组件收到 taskTriggered 事件，任务信息：', taskInfo);
      // this.currentTaskInfo = {
      //   ...this.currentTaskInfo,
      //   ...taskInfo,
      //   isTaskTriggered: true 
      // };
      this.currentTaskInfo.isTaskTriggered = true;
    });

    eventBus.on('titleBarShareSuccess', async() => {
      let shareTask = undefined;
      const taskConfig = this.state.taskConfig;
        for (let i = 0; i < taskConfig.length; i++) {
          const currentTask = taskConfig[i];
          if (currentTask.taskType === 7) {
            shareTask = currentTask;
        break; 
        }
      }
      if (shareTask?.taskId) {
        this.currentTaskInfo = {
          ...this.currentTaskInfo,
          taskId: shareTask.taskId,
          taskType: 7,
          isTaskTriggered: true 
      };
      this.setState({ isTaskSubmitting: true });
      await this.handleTaskReport(shareTask.taskId);
      this.initData();
      }
  });
    eventBus.on('browseTaskComplete', async () => {
      let browseTask = undefined;
      const taskConfig = this.state.taskConfig;
      for (let i = 0; i < taskConfig.length; i++) {
        const currentTask = taskConfig[i];
        if (currentTask.taskType === 8) {
          browseTask = currentTask;
          break;
        }
      }
      if (browseTask?.taskId) {
        this.currentTaskInfo = {
          ...this.currentTaskInfo,
          taskId: browseTask.taskId,
          taskType: 8,
          isTaskTriggered: true 
      };
        this.setState({ isTaskSubmitting: true });
        await this.handleTaskReport(browseTask.taskId);
        this.initData();
    }
  });

  LightMobileCall.KgWebMobileCall("KgWebMobileCall.pageStatusNew", (res) => {
    try {
      res = JSON.parse(res);
    } catch (error) { }

    if (res?.status === 3) {
      // webview重新展示（活动页重新展示）
      // 需要刷新接口更新状态
      // refresh
      eventBus.emit('refresh');
      }
    });
    apmLog({
      typeid: 111645,
      state: 1,
      para: 14,
      position: "01",
      realtime1: window.location.href,
      page: 0
    });
  }

  callKugouLogin = async () => {
    if (!LightMobileCall.isInClient()) {
    return; 
  }
    if (this._baseInfo?.userid) return;

    const loginParams = {
      topicName: "养狗春节挖宝",
      loginType: '',
      popupType: 1,
    };

    LightMobileCall.mobileCall(102, loginParams);
    LightMobileCall.KgWebMobileCall("KgWebMobileCall.userStatus", async () => {
      const newBaseInfo = await baseInfo();
      //TODO

      if (newBaseInfo?.userid !== this._baseInfo?.userid) {
        this.setState({ showEmptyImage: false });
        window.location.reload();
      }
    });
  };

  getKgClientVersion = async () => {
    const { isLowVersion } = this.state;
    // 已判断过版本号，直接返回结果
    if (isLowVersion !== null) return isLowVersion;
    const TARGET_VERSION = LightMobileCall.isIOS 
      ? this.props.iOS_TARGET_VERSION 
      : this.props.Android_TARGET_VERSION;
    return new Promise((resolve) => {
      LightMobileCall.mobileCall(122, {}, (response) => {
        try {
          const currentVersion = response?.status === 1 ? Number(response.version) : 0;
          const isLow = currentVersion <= Number(TARGET_VERSION);
          this.setState({ isLowVersion: isLow });
          resolve(isLow); 
        } catch (error) {
          // 处理版本号出错：默认视为低版本
          this.setState({ isLowVersion: true });
          resolve(true);
        }
      });
    });
  };

  async checkLoginStatus() {
    let getbaseInfo = null;
    try{
        getbaseInfo = await baseInfo();
      //TODO
    if (!getbaseInfo?.userid) {
      this.callKugouLogin();
      this.setState({
        showEmptyImage: true, 
        isLoginLoading: false
      });
      return
    } 
    const isLow = await this.getKgClientVersion();
      if (isLow) {
        Toast.info({ content: '当前酷狗版本过低，请先升级' });
        setTimeout(() => {
        closePage();
      }, 2500);
        this.setState({ 
          isVersionForbidden: true,
          showEmptyImage: true,
          isLoginLoading: false,
        });
        return; 
      }
      this.setState({ 
        showEmptyImage: false,
        // isLoginLoading: false,
      });
      this._baseInfo = getbaseInfo;
      this.checkPetAdoptStatus();

    }catch(err){
      // 异常处理：重置状态
      this.setState({
        showEmptyImage: true,
        isLoginLoading: false
      });
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E4", // 客户端异常
        position: "01",
        fs: "999_14",
        hash: `错误：${err.message}`,
        interfaceurl: "baseInfo",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
    }finally{
      loading.hide();
    }
  };

  handleBrowserVisibilityChange = () => {
    const isKgClient = !!window.LightMobileCall && !!window.KgWebMobileCall;
    if (!isKgClient && document.visibilityState === 'visible') {
      const { isTaskTriggered } = this.currentTaskInfo;
      if (isTaskTriggered) {
        this.initData();
        this.currentTaskInfo.isTaskTriggered = false;
      }
    }
  };

  handleTaskReport = async (taskId) => {
    const toast = Toast.loading({
    duration: 0,
    mask: true,
  });
    try {
      await DigTaskComplete(taskId);
      apmLog({
        typeid: 111645,
        state: 1,
        para: 14,
        page: 0
      });//TODO
      this.initData();
    } catch (err) {
      const getbaseInfo = await baseInfo();
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1",
        position: "04",
        fs: `${err?.code || 999}_14`, 
        hash: `错误：${err.msg || err.message || '任务提交失败'}`,
        interfaceurl: "/kugoupet/activity/digTaskComplete",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      console.error('任务更新失败:', err);
      Toast.info('任务状态更新失败，请稍后重试');
    } finally {
      this.setState({ isTaskSubmitting: false });
      toast.remove();
    }
  };

  componentWillUnmount() {
    eventBus.off('refresh', this.initData);
    eventBus.off('taskTriggered');
    eventBus.off('titleBarShareSuccess');
    eventBus.off('browseTaskComplete');
    document.removeEventListener('visibilitychange', this.handleBrowserVisibilityChange); // 新增
  }

  // 获取奖励
  onGotPrize = (rewardId, gridInfo) => {
    // 啥也没挖到
    if (gridInfo?.rewardId === 0) {
      Toast.info({
        content: '很遗憾，没有挖到宝物'
      });
      return;
    } else if (rewardId > 0) {
      const isCard = rewardId === 2001 || rewardId === 2002 || rewardId === 2003 || rewardId === 3001 || rewardId === 3002;
      const rewardItem = this._rewardConfigMap[rewardId];
      const rewardTitle = `恭喜获得「${rewardItem?.rewardDesc}」`;
      const rewardSubtitle = this.getRewardSubtitle(rewardId);
      this.setState({ 
        showRewardModal: true,
        rewardModalImageWidth: (rewardId === 2001 || rewardId === 2002 || rewardId === 2003) ? '100%' : '50%',
        rewardModalImage: prizeMap[rewardId + '']?.src,
        currentRewardId: rewardId,
        rewardModalBtnText: isCard ? '立即查看' : '立即领取',
        rewardModalTitle: rewardTitle,
        rewardModalSubtitle: rewardSubtitle
      });
    }
  }

  scrollToBottom = () => {
    document.querySelector('#page').scrollTo({
      top: document.querySelector('#page').scrollHeight,
      behavior: 'smooth'
    });
  };

  isAllTasksCompleted = () => {
  const { taskConfig, tasks } = this.state;
  // 无任务配置时，视为任务完成
  if (taskConfig.length === 0) return true;
  // 遍历所有任务，要求每个任务都完成次数达标 + 已领取奖励,才判定为全完成
  return taskConfig.every(config => {
    // 匹配用户当前任务状态，无匹配则视为未完成
    const userTask = tasks.find(t => t.taskId === config.taskId) || { curNum: 0, isAwarded: false };
    // 任务完成判定条件：完成次数>=要求次数 且已领取奖励
    return userTask.curNum >= config.taskNum && userTask.isAwarded;
  });
};

  handleCellClick = async (cellId, prizeInfo, cellInfo) => {
    const grids = this.state.grids;
    // 已经挖完了
    if (grids.length === 54) {
      const rewardId = cellInfo?.rewardId;
      if (rewardId === 0) {
        return;
      }
      // const isCard = rewardId === 2001 || rewardId === 2002 || rewardId === 2003 || rewardId === 3001 || rewardId === 3002;
      // const rewardItem = this._rewardConfigMap[rewardId];
      // const rewardTitle = `恭喜获得「${rewardItem?.rewardDesc}」`;
      // const rewardSubtitle = this.getRewardSubtitle(rewardId);
      // this.setState({ 
      //   showRewardModal: true,
      //   rewardModalImageWidth: (rewardId === 2001 || rewardId === 2002 || rewardId === 2003) ? '100%' : '50%',
      //   rewardModalImage: prizeInfo?.src,
      //   currentRewardId: rewardId,
      //   rewardModalBtnText: isCard ? '立即查看' : '知道了',
      //   rewardModalTitle: rewardTitle,
      //   rewardModalSubtitle: rewardSubtitle
      // });
      const rewardItem = this._rewardConfigMap[rewardId];
      const rewardName = rewardItem?.rewardDesc;
      Toast.info({
        content: `已获得「${rewardName}」`, 
        mask: false // 不需要遮罩
      });
      return;
    }

    if (this.state.digNum <= 0) {
      this.scrollToBottom()
      const isAllTaskDone = this.isAllTasksCompleted();
      const tipText = isAllTaskDone 
        ? '今天的任务已经都做完啦，明天再来挖宝吧！' 
        : '暂无挖宝机会，快来做任务获取吧~';
      Toast.fail(tipText);
      return false;
    }
    mobileLog({
      a: 23320001,
      b: '点击',
      ft: '春节挖宝活动页',
      r: '养狗',
      svar1:'1'
    });
    // 这里可以调用接口获取奖励
    const toast = Toast.loading({
      duration: 0,
      mask: true,
      content: '挖宝中...',
    });
    const getbaseInfo = await baseInfo();
    const res = await openDig(cellId).catch((err) => {
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1",
        position: "05",
        fs: `${err?.code || 999}_14`,
        hash: `错误：${err.message}`,
        interfaceurl: "/kugoupet/activity/digGridOpen",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      toast.remove();
      Toast.fail(`挖宝失败，请稍后重试`);
    });
    toast.remove();
    if (res?.data?.code === 0) {
      const grids = [...this.state.grids];
      grids.push({
        ...res?.data?.data?.gridInfo
      });
      this.setState({
        digNum: res?.data?.data?.digNum || 0,
        grids
      });
      this.onGotPrize(res?.data?.data?.rewardId, res?.data?.data?.gridInfo);
        apmLog({
          typeid: 111645,
          state: 1,
          para: 14,
          page: 0
        });
      } else if (res?.data?.code === 100500) {
        Toast.fail(`暂无挖宝机会，快来做任务获取吧~`);
        return false;
      } else {
        Toast.fail(`挖宝失败，请稍后重试`);
        return false;
      }
      return true;
  }

  handleRuleClick = async () => {
    const url = buildJupmUrl({ pageName: 'index_rule' });
    jumpPage(url, url);
  }

  handlePrizeClick = async () => {
    const url = buildJupmUrl({ pageName: 'index_prize' });
    jumpPage(url, url);
  }

  // 关闭每日登录弹窗
  handleCloseDailyLoginModal = () => {
    this.setState({ showDailyLoginModal: false });
  }

  // 点击立即挖宝按钮
  handleDailyLoginConfirm = () => {
    this.setState({ showDailyLoginModal: false });
    // 可以在这里添加滚动到挖宝区域等逻辑
  }

  handleCloseRewardModal = () => {
    this.setState({ showRewardModal: false });
  }

  handleConfirmRewardModal = () => {
    this.setState({ showRewardModal: false });
    const rewardId = this.state.currentRewardId;
    const isCard = rewardId === 2001 || rewardId === 2002 || rewardId === 2003 || rewardId === 3001 || rewardId === 3002;
    if (isCard) {
      eventBus.emit('share', {
        cardImage: cardMap[rewardId + ''],
        url: window.location.href,
      });
    }
  }


  render () {
    const { isActivityEnded, isLoginLoading, digNum, rewardConfig, taskConfig, grids, tasks, dataInited, showDailyLoginModal, showRewardModal, rewardModalImage, rewardModalImageWidth, rewardModalBtnText, rewardModalTitle, rewardModalSubtitle, showEmptyImage, currentRewardId, needRedirect, isVersionForbidden } = this.state;
    const sharePosterConfig = this.props.sharePosterConfig;
    const vipUrl = this.props.vipUrl;
    const SvipUrl = this.props.SvipUrl;
    const petTaskUrl = this.props.petTaskUrl;
    const vipIcon = this.props.vipIcon;
    const useSharePic = this.props.useSharePic;
    const iOS_TARGET_VERSION = this.props.iOS_TARGET_VERSION;
    const Android_TARGET_VERSION = this.props.Android_TARGET_VERSION
    // const shareConfig = this.props.share

    if (isLoginLoading ) {
      return null; //解决接口返回慢导致登录页一闪而过
     }
     if (isVersionForbidden || isActivityEnded) {
      return (
        <div className={styles.wrap} id="page">
          <div className={styles.emptyContent}>
            <img 
              src={kg20EmptyLogin} 
              alt="" 
              className={styles.emptyImage} 
            />
          </div>
        </div>
      );
    }
    
    const mainContent = (
    <>
      {LightMobileCall.isInClient() ? <Titlebar bgMusic= 'https://webfile.yun.kugou.com/fmt01_600dc8816ce86a7de422299da914f786.mp3' iconColor="#fff" useSharePic={useSharePic} showShare={true} shareConfig={sharePosterConfig}/> : null }
      <Header
        chanceCount={digNum}
        rewardConfig={rewardConfig}
        grids={grids}
        showDailyLoginModal={showDailyLoginModal}
        onCellClick={this.handleCellClick}
        dataInited={dataInited}
        onRuleClick={this.handleRuleClick}
        onPrizeClick={this.handlePrizeClick}
      />
      <Tasks tasks={tasks} 
        taskConfig={taskConfig} 
        shareConfig={sharePosterConfig} 
        vipUrl={vipUrl} 
        SvipUrl={SvipUrl} 
        petTaskUrl={petTaskUrl} 
        vipIcon={vipIcon} 
        useSharePic={useSharePic} 
        isTaskSubmitting={this.state.isTaskSubmitting} 
        iOS_TARGET_VERSION={iOS_TARGET_VERSION}
        Android_TARGET_VERSION={Android_TARGET_VERSION}
        />
      
      {/* 每日首次登录弹窗 */}
      <DailyLoginModal
        visible={showDailyLoginModal}
        onClose={this.handleCloseDailyLoginModal}
        onConfirm={this.handleDailyLoginConfirm}
      />
      <SharePoster shareConfig={sharePosterConfig} />
      <RewardModal
        visible={showRewardModal}
        animalImage={rewardModalImage}
        onClose={this.handleCloseRewardModal}
        onConfirm={this.handleConfirmRewardModal}
        buttonText={rewardModalBtnText}
        imgWidth={rewardModalImageWidth}
        title={rewardModalTitle}
        subtitle={rewardModalSubtitle}
        rewardId={currentRewardId}
      />
    </>
  );

    return (
      <div className={styles.wrap} id="page">
        {LightMobileCall.isInClient()?(
          needRedirect ? (
            <>
              <div className={styles.shareMask}>
              </div>
              {mainContent}
            </> 
          ) :
            <>
              {showEmptyImage && (
                <div className={styles.emptyContent}>
                  <img src={kg20EmptyLogin} alt= "未登录" className={styles.emptyImage} />
                  <button
                    onClick={this.callKugouLogin}
                    className={styles.loginButton}
                  >
                    登录
                  </button>
                </div>
              )}
            {!showEmptyImage && mainContent}
          </>
        ) : (
          <>
            <div className={styles.shareMask} >
              <button 
              className = {styles.callButton}
              onClick={callAppLogin}
              //TODO
            >
              去酷狗一起挖宝
            </button>
            </div>

          <Header
            chanceCount={digNum}
            rewardConfig={rewardConfig}
            grids={grids}
            showDailyLoginModal={showDailyLoginModal}
            onCellClick={this.handleCellClick}
            dataInited={dataInited}
            onRuleClick={this.handleRuleClick}
            onPrizeClick={this.handlePrizeClick}
          />
          </>
        )}
        </div>
    );
  }
}

Index.defaultProps = data;

export default Index;
