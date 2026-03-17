import React, { Component } from 'react';
import '../assets/common.css';
import styles from './Index.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import Titlebar from '../components/titlebar';
import { Toast } from '@cola/Toast';
import { jumpPage, buildJupmUrl, baseInfo, callAppLogin, openLittleNest, closePage, handleSharePic, openNewPage} from '../utils/util'; 
import Header from '../components/Header';
import Tasks from '../components/Tasks';
import { getLotteryInfo, lottery, lotteryTaskComplete, getPetChatInfoCore } from '../assets/api';
import { getGlobalEvent } from '../utils/eventEmitter';
import LightMobileCall from '@kugou/light-mobilecall';
import SharePoster from '../components/SharePoster';
import RewardModal from '../components/RewardModal';
import ExchangeModal from '../components/ExchangeModal';
import { prizeMap } from '../utils/common';
import kg20EmptyLogin from '@cola/KGImage/src/assets/kg20/empty-login.js';
import {loading} from '../utils/common'
import mobileLog from "../utils/mobileLog";
import { apmLog } from '../utils/apmLog';
import callButtonImg from '../assets/image/callButtonImg.png';
// import share from '@kugou/share';

const eventBus = getGlobalEvent();
const data = combineSubmodule('Index');

// 活动未开始或已经结束时返回的错误码（前置检查）
const ACTIVITY_NOT_AVAILABLE_CODE = 100602;

class Index extends Component {
  state = {
    rewardConfig: [],
    taskConfig: [],
    tasks: [],
    dataInited: false,
    showRewardModal: false,
    rewardModalImageWidth: '100%',
    rewardModalImage: '',
    currentRewardId: 0,
    currentRewardType: 0, //存储当前奖品的type
    currentRewardUrl: '',
    currentRedeemCode: '', //存储当前奖品的兑换码
    rewardModalBtnText: '去领取',
    rewardModalTitle: '恭喜获得奖励',
    rewardModalSubtitle: '运气超棒~',
    showEmptyImage: true,
    isLoginLoading: true,
    isTaskSubmitting: false,
    isPetCheckLoading: false,
    needRedirect: false,
    isLowVersion: null,
    isVersionForbidden: false,
    isActivityEnded: false,
    lotteryNum: 0,
    isHeaderReady: false,
    sharePicStatus: 'loading',
    showExchangeModal: false //控制ExchangeModal显示
  }

  currentTaskInfo = {
    isTaskTriggered: false
  };

  //弹窗增加按钮功能，去游戏
  petHandleUse = async() => {
    const { isLoading } = this.state;
    if (isLoading) return;
    try {
      this.setState({ isLoading: true });
      const [response] = await getPetChatInfoCore();
      this.setState({ isLoading: false });
      if (!response) {
        throw new Error("网络异常，请稍后重试...");
      }
      const targetTab = response?.hasAdopt === 1 ? 1 : 0;
      openNewPage(targetTab);
    } catch (err) {
      Toast.info({ content: err.message });
      this.setState({ isLoading: false });
    }finally {
      this.setState({ isLoading: false });
    }
  };

  //弹窗使用优惠券
  handleBtnClick = (config) => {
    const { link } = config;
    if (!link) return;
    LightMobileCall.mobileCall(123, { url: link, browser: 4 });
  };

  checkActivityEndByApi = (apiEndTime) => {
    if (!apiEndTime) return false;
    const currentTime = new Date().getTime();
    const endTimeNum = Number(apiEndTime);
    if (isNaN(endTimeNum)) return false;
    const endTimeStamp = endTimeNum * 1000;
    return currentTime > endTimeStamp; 
  };

  checkPetAdoptStatus = async () => {
    if(!LightMobileCall.isInClient()) return;
    this.setState({ isPetCheckLoading: true });

    try {
      const [response] = await getPetChatInfoCore();
      if (!response) {
        console.log('response', response);
        throw new Error("网络异常，请稍后重试...");
      }
      apmLog({
        typeid: 111645,
        state: 1,
        para: 14,
        page: 0
      });
      // console.log('response', response);
      const isAdopted = response?.hasAdopt === 1;
      if (!isAdopted) {
        console.log('isAdopted', isAdopted);
        Toast.info({ 
          content: "请先领养宠物再来参加抽奖活动~",
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
      loading.hide();
    }
  };

  getRewardSubtitle = (rewardId) => {
    const { props } = this;
    if ([1,2,3,4,5].includes(rewardId)) {
      return props.prizeCopywriting[`text${rewardId}`] || '运气超棒~';
    }
    return props.prizeCopywriting.textDefault || '运气超棒~';
  };

  transRewardConfig = (rewardConfig) => {
    this._rewardConfigMap = {};
    for (let i = 0; i < rewardConfig.length; i++) {
      const item = rewardConfig[i];
      this._rewardConfigMap[item.id] = item;
    }
  }

  initData = async () => {
    if (this.state.isVersionForbidden) {
      loading.hide();
      return;
    }
    if (this.state.isActivityEnded) {
      loading.hide();
      return;
    }
    const getbaseInfo = await baseInfo();
    let res = null;
    if (LightMobileCall.isInClient()) {
      try {
        res = await getLotteryInfo();
        // 活动未开始或已经结束时返回的错误码（前置检查），不作为异常上报 
        if (res?.data?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
          this.setState({
            isActivityEnded: true,
            isLoginLoading: false,
            showEmptyImage: true
          }, () => {
            Toast.info({ content: '活动已结束' });
            setTimeout(() => closePage(), 2500);
          });
          loading.hide();
          return;
        }
        if (res?.data?.code === 0) {
          const data = res?.data?.data || {};
          const endTime = data.endTime;
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
            loading.hide();
            return;
          }

          this.setState({
            dataInited: true,
            rewardConfig: data.rewardList || [],
            taskConfig: data.taskConfig || [],
            tasks: data.tasks || [],
            lotteryNum: data.LotteryNum || 0,
            isLoginLoading: false
          }, () => {
            this.transRewardConfig(data.rewardList || []);
            loading.hide();
          });
          
          apmLog({
            typeid: 111645,
            state: 1,
            para: 14,
            page: 0
          });
        } else {
          apmLog({
            typeid: 111645,
            state: 0,
            para: 14,
            te: "E2", 
            position: "02",
            fs: `${res?.data?.code || 999}_14`,
            hash: `错误：${res?.data?.msg || '服务端处理失败'}`,
            interfaceurl: "/kugoupet/activity/lotteryInfo",
            realtime1: window.location.href,
            page: getbaseInfo?.userid || 0 
          });
          loading.hide();
        }
      } catch (err) {
        // 活动未开始或已经结束时返回的错误码（前置检查），不作为异常上报 
        if (err?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
          this.setState({
            isActivityEnded: true,
            isLoginLoading: false,
            showEmptyImage: true
          }, () => {
            Toast.info({ content: '活动已结束' });
            setTimeout(() => closePage(), 2500);
          });
          loading.hide();
          return;
        }
        apmLog({
          typeid: 111645,
          state: 0,
          para: 14,
          te: "E1", 
          position: "02",
          fs: `999_14`,
          hash: `错误：${err.msg || err.message || '网络异常，请求失败'}`,
          interfaceurl: "/kugoupet/activity/lotteryInfo",
          realtime1: window.location.href,
          page: getbaseInfo?.userid || 0
        });
        this.setState({ isLoginLoading: false });  
        loading.hide();
      }
        window.vs_finish && window.vs_finish();
        LightMobileCall.mobileCall(1203)
    }
    if (!LightMobileCall.isInClient()) {
      window.vs_finish && window.vs_finish();
      LightMobileCall.mobileCall(1203)
    }
  };

  initClientPageListener = () => {
    LightMobileCall.KgWebMobileCall("KgWebMobileCall.shareStatus", (res) => {
      try {
        res = JSON.parse(res);
        console.log('res', res);
      } catch (error) {}
      console.log('看看是否有值shareStatus', res?.status);
      // 分享按钮点击后，设置全局变量，用于客户端回调判断是否成功
      if (window.isClickShareBtn === 1 && Number(res.status) != null) {
        eventBus.emit('titleBarShareSuccess'); 
      }
    });
  };
  
  componentDidMount () {
    // const shareConfig = this.props.sharePosterConfig || {};
    handleSharePic({
      useSharePic: this.props.useSharePic || '', 
      defaultShareConfig: this.props.sharePosterConfig || {},
      onStatusChange: (status) => {
        this.setState({ sharePicStatus: status });
      }
    });

    loading.show();
    // if (LightMobileCall.isInClient()) {
    //   loading.show();
    // }
    LightMobileCall.mobileCall(128, { state: 0 })
    LightMobileCall.mobileCall(1369, {type: 0});
    this.initData();
    this.initClientPageListener();
    this.checkLoginStatus();
    document.addEventListener('visibilitychange', this.handleBrowserVisibilityChange);

    window._kg_opendata_ = {
      page: "活动页",
      activityName: "养狗品牌合作抽奖" || document.title,
      activityId: "" || window._VO_ACT_ID_,
      codeSystem: "voo",
      channel: "",
    }
    if (window._kg_openkugouapp_pageExposeReported_fun_) {
      window._kg_openkugouapp_pageExposeReported_fun_();
    }

    mobileLog({
      a: 1134953,
      b: '曝光',
      ft: '贵族摇奖机各页面',
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
      // loading.show();
      this.initData();
    });

    eventBus.on('taskTriggered', (taskInfo) => {
      this.currentTaskInfo.isTaskTriggered = true;
    });

    eventBus.on('titleBarShareSuccess', async() => {
      let shareTask = undefined;
      const taskConfig = this.state.tasks;
      for (let i = 0; i < taskConfig.length; i++) {
        const currentTask = taskConfig[i];
        if (currentTask.taskType === 8) {
          shareTask = currentTask;
          break; 
        }
      }
      if (shareTask?.taskId) {
        this.currentTaskInfo = {
          ...this.currentTaskInfo,
          taskId: shareTask.taskId,
          taskType: 8,
          isTaskTriggered: true 
        };
        this.setState({ isTaskSubmitting: true });
        await this.handleTaskReport(shareTask.taskId);
        loading.show();
        this.initData();
      }
    });

    LightMobileCall.KgWebMobileCall("KgWebMobileCall.pageStatusNew", (res) => {
      try {
        res = JSON.parse(res);
      } catch (error) { }
      if (res?.status === 3) {
        loading.show();
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
      topicName: "养狗品牌合作抽奖",
      loginType: '',
      popupType: 1,
    };

    LightMobileCall.mobileCall(102, loginParams);
    LightMobileCall.KgWebMobileCall("KgWebMobileCall.userStatus", async () => {
      const newBaseInfo = await baseInfo();
      if (newBaseInfo?.userid !== this._baseInfo?.userid) {
        this.setState({ showEmptyImage: false });
        window.location.reload();
      }
    });
  };

  getKgClientVersion = async () => {
    const { isLowVersion } = this.state;
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
      if (!getbaseInfo?.userid) {
        this.callKugouLogin();
        this.setState({
          showEmptyImage: true, 
          isLoginLoading: false
        });
        loading.hide();
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
        loading.hide();
        return; 
      }
      this.setState({ 
        showEmptyImage: false,
      });
      this._baseInfo = getbaseInfo;
      this.checkPetAdoptStatus();
    }catch(err){
      this.setState({
        showEmptyImage: true,
        isLoginLoading: false
      });
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E4",
        position: "01",
        fs: "999_14",
        hash: `错误：${err.message}`,
        interfaceurl: "baseInfo",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      loading.hide();
    }finally{
        loading.hide();
    }
  };

  handleBrowserVisibilityChange = () => {
    const isKgClient = !!window.LightMobileCall && !!window.KgWebMobileCall;
    if (!isKgClient && document.visibilityState === 'visible') {
      const { isTaskTriggered } = this.currentTaskInfo;
      if (isTaskTriggered) {
        loading.show();
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
      const res = await lotteryTaskComplete(taskId);
      // 活动未开始或已经结束时返回的错误码（前置检查），不作为异常上报 
      if (res?.data?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
        this.setState({ isActivityEnded: true });
        Toast.info({ content: '活动已结束' });
        loading.hide();
        return;
      }
      apmLog({
        typeid: 111645,
        state: 1,
        para: 14,
        page: 0
      });
      this.initData();
    } catch (err) {
      // 活动未开始或已经结束时返回的错误码（前置检查），不作为异常上报 
      if (err?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
        this.setState({ isActivityEnded: true });
        Toast.info({ content: '活动已结束' });
        loading.hide();
        return;
      }
      const getbaseInfo = await baseInfo();
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1",
        position: "04",
        fs: `${err?.code || 999}_14`, 
        hash: `错误：${err.msg || err.message || '任务提交失败'}`,
        interfaceurl: "/kugoupet/activity/lotteryTaskComplete",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      console.error('任务更新失败:', err);
      Toast.info('任务状态更新失败，请稍后重试');
    } finally {
      this.setState({ isTaskSubmitting: false });
      toast.remove();
      loading.hide();
    }
  };

  shareTaskReport = async (taskId) => {
    return Promise.resolve({ code: 0 });
  };

  componentWillUnmount() {
    eventBus.off('refresh', this.initData);
    eventBus.off('taskTriggered');
    eventBus.off('titleBarShareSuccess');
    eventBus.off('browseTaskComplete');
    eventBus.off('openExchangeModal');
    document.removeEventListener('visibilitychange', this.handleBrowserVisibilityChange);
    loading.hide();
  }

  // 滚动到任务区
  scrollToTaskArea = () => {
    const el = document.getElementById('task-area');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const page = document.querySelector('#page');
      if (page) {
        page.scrollTo({ top: page.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  // 是否全部任务已完成
  isAllTasksCompleted = () => {
    const { tasks } = this.state;
    if (!tasks || tasks.length === 0) return true;
    return tasks.every(t => t.curNum >= t.taskNum && t.isAwarded);
  };

  handleRaffle = async () => {
    const { lotteryNum, isActivityEnded } = this.state;
    
    if (isActivityEnded) {
      Toast.info({ content: '活动已结束，感谢参与~' });
      loading.hide();
      return { success: false };
    }
    if (lotteryNum <= 0) {
      this.scrollToTaskArea();
      const isAllTaskDone = this.isAllTasksCompleted();
      const tipText = isAllTaskDone
        ? '今天的任务已经都做完啦，明天再来抽奖吧！'
        : '暂无抽奖机会，快来做任务获取吧~';
      Toast.fail(tipText);
      return { success: false };
    }

    mobileLog({
      a: 1134954,
      b: '点击',
      ft: '贵族摇奖机页面',
      r: '养狗',
      svar1: '1'
    });

    const getbaseInfo = await baseInfo();
    try {
      loading.show();
      const res = await lottery();
      // 活动未开始或已经结束时返回的错误码（前置检查），不作为异常上报 
      if (res?.data?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
        this.setState({ isActivityEnded: true });
        Toast.info({ content: '活动已结束，感谢参与~' });
        loading.hide();
        return { success: false };
      }
      if (res?.data?.code === 0) {
        const rewardData = res?.data?.data || {};
        // console.log('[调试] 抽奖返回', {
        //   fullResData: res?.data,
        //   rewardData,
        //   rewardId: rewardData.rewardId,
        //   rewardType: rewardData.rewardType,
        //   redeemCode: rewardData.redeemCode
        // });
        const rewardId = rewardData.rewardId || 0;
        const rewardType = rewardData.rewardType || 0; //获取type
        const rewardUrl = rewardData.url || '';
        const rewardName = rewardData.name || '未知奖励';
        const redeemCode = rewardData.redeemCode || ''; //获取兑换码

        this.setState({
          currentRewardId: rewardId,
          currentRewardType: rewardType, //存储type
          currentRewardUrl: rewardUrl,
          currentRedeemCode: redeemCode, //存储兑换码
          rewardModalTitle: `恭喜获得「${rewardName}」`,
          rewardModalSubtitle: this.getRewardSubtitle(rewardId),
          rewardModalImage: prizeMap[rewardId + '']?.src || '',
          rewardModalImageWidth: '50%',
          rewardModalBtnText: rewardId === 5 ? '去喂养' : '去领取'
        });

        this.initData();
        apmLog({
          typeid: 111645,
          state: 1,
          para: 14,
          page: 0
        });

        loading.hide();
        return {
          success: true,
          rewardId: rewardId,
          onRaffleComplete: () => {
            this.setState({ showRewardModal: true });
          }
        };
      }
      Toast.fail(`抽奖失败，请稍后重试`);
      loading.hide();
      return { success: false };
    } catch (err) {
      // 活动未开始或已经结束时返回的错误码（前置检查）
      if (err?.code === ACTIVITY_NOT_AVAILABLE_CODE) {
        this.setState({ isActivityEnded: true });
        Toast.info({ content: '活动已结束，感谢参与~' });
        loading.hide();
        return { success: false };
      }
      apmLog({
        typeid: 111645,
        state: 0,
        para: 14,
        te: "E1",
        position: "05",
        fs: `${err?.code || 999}_14`,
        hash: `错误：${err.message}`,
        interfaceurl: "/kugoupet/activity/lottery",
        realtime1: window.location.href,
        page: getbaseInfo?.userid || 0
      });
      Toast.fail(`抽奖失败，请稍后重试`);
      loading.hide();
      return { success: false };
    }
  };

  handleRuleClick = async () => {
    const url = buildJupmUrl({ pageName: 'index_rule' });
    jumpPage(url, url);
  }

  handlePrizeClick = async () => {
    const url = buildJupmUrl({ pageName: 'index_prize' });
    jumpPage(url, url);
  }

  handleCloseRewardModal = () => {
    this.setState({ showRewardModal: false });
  }

  handleConfirmRewardModal = () => {
    //关闭RewardModal
    this.setState({ showRewardModal: false }, () => {
      const { currentRewardId, currentRewardType, currentRewardUrl, currentRedeemCode } = this.state;
      const prizeId = String(currentRewardId);
      const isPrize1 = prizeId === '1' && currentRewardType === 1;
      const isPrize2Or3 = ['2', '3'].includes(prizeId);
      const isPrize4 = prizeId === '4';
      const isPrize5 = prizeId === '5';

      // 1、2、3：唤起 ExchangeModal（兑换码+去兑换）；4：直接跳转；5：去喂养
      if (isPrize1 || isPrize2Or3) {
        this.setState({
          showExchangeModal: true,
          currentRedeemCode: currentRedeemCode
        });
      } else if (isPrize4) {
        this.handleBtnClick({ link: currentRewardUrl });
      } else if (isPrize5) {
        this.petHandleUse();
      }
    });
  };

  // handleExchange = async (redeemCode) => {
  //   try {
  //     const res = await getLotteryRewardList();
  //     if (res?.data?.code === 0 && Array.isArray(res.data?.data?.rewardList)) {
  //       const targetPrize = res.data.data.rewardList.find(
  //         item => item.redeemCode === redeemCode
  //       );
  //       if (targetPrize?.url) {
  //         LightMobileCall.mobileCall(123, { url: targetPrize.url, browser: 4 });
  //       } else {
  //         Toast.info({ content: '暂无跳转链接' });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('兑换跳转失败:', error);
  //     Toast.info({ content: '兑换跳转失败，请稍后重试' });
  //   }
  // };

  render () {
    const { 
      isActivityEnded, isLoginLoading, lotteryNum, rewardConfig, taskConfig, tasks, 
      dataInited, showRewardModal, rewardModalImage, rewardModalImageWidth, 
      rewardModalBtnText, rewardModalTitle, rewardModalSubtitle, showEmptyImage, 
      currentRewardId, currentRewardUrl, needRedirect, isVersionForbidden,isHeaderReady,
      showExchangeModal, currentRedeemCode
    } = this.state;

    const { 
      sharePosterConfig, vipUrl, SvipUrl, petTaskUrl, vipIcon, useSharePic,
      iOS_TARGET_VERSION, Android_TARGET_VERSION
    } = this.props;

    if (isLoginLoading ) {
      return null;
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
        {LightMobileCall.isInClient() ? 
          <Titlebar 
            iconColor="#fff" 
            useSharePic={useSharePic} 
            showShare={true} 
            shareConfig={sharePosterConfig}
          /> : null 
        }
        <div className={styles.overlapContainer}>
          <div className={styles.headerLayer}>
            <Header
              chanceCount={lotteryNum}
              rewardConfig={rewardConfig}
              dataInited={dataInited}
              onRuleClick={this.handleRuleClick}
              onPrizeClick={this.handlePrizeClick}
              onRaffle={this.handleRaffle}
              onHeaderReady={() => this.setState({ isHeaderReady: true })}
            />
          </div>
          
          {isHeaderReady && (
            <div id="task-area" className={styles.tasksStage}>
              <img
                src='https://voowebpbssdl.kugou.com/eada3261b27f1a957fc25373fbbaa68a.png'
                className={styles.taskBg}
                alt=''
              />
              <div className={styles.tasksLayer}>
                <Tasks 
                  tasks={tasks} 
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
              </div>
            </div>
          )}
        </div>
      
        {isHeaderReady && (
          <>
            <SharePoster shareConfig={sharePosterConfig} />
            <RewardModal
              visible={showRewardModal}
              animalImage={rewardModalImage}
              onClose={this.handleCloseRewardModal}
              onConfirm={this.handleConfirmRewardModal} // 传递修改后的回调
              buttonText={rewardModalBtnText}
              imgWidth={rewardModalImageWidth}
              title={rewardModalTitle}
              subtitle={rewardModalSubtitle}
              rewardId={currentRewardId}
              rewardUrl={currentRewardUrl}
            />
            <ExchangeModal
              shareConfig={sharePosterConfig}
              exchangeCode={currentRedeemCode}
              prizeId={currentRewardId}
              onClose={() => this.setState({ showExchangeModal: false })}
              visible={showExchangeModal}
            />
          </>
        )}
      </>
    );

    const isLoginEmpty = LightMobileCall.isInClient() && !needRedirect && showEmptyImage;
    return (
      <div className={isLoginEmpty ? styles.wrapLoginBg : styles.wrap} id="page">
        {LightMobileCall.isInClient()?(
          needRedirect ? (
            <>
              <div className={styles.shareMask}></div>
              {mainContent}
            </> 
          ) : (
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
          )
        ) : (
          <>
            <div className={styles.shareMask} >
              <button 
                className = {styles.callButton}
                onClick={callAppLogin}
              >
                {/* 去酷狗参与抽奖 */}
                <img src={callButtonImg} alt="去酷狗参与抽奖" className={styles.callButtonImg} />
              </button>
            </div>
            <div className={styles.overlapContainer}>
              <div className={styles.headerLayer}>
                <Header
                  chanceCount={lotteryNum}
                  rewardConfig={rewardConfig}
                  dataInited={dataInited}
                  onRuleClick={this.handleRuleClick}
                  onPrizeClick={this.handlePrizeClick}
                  onRaffle={this.handleRaffle}
                  onHeaderReady={() => this.setState({ isHeaderReady: true })}
                />
              </div>
          </div>
          <div id="task-area" className={styles.tasksStage}>
            <img
              src='https://voowebpbssdl.kugou.com/eada3261b27f1a957fc25373fbbaa68a.png'
              className={styles.taskBg}
              alt=''
            />
        </div>
        </>
        )}
      </div>
    );
  }
}

Index.defaultProps = data;
export default Index;