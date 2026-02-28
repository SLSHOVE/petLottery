import React, { useEffect, useState, useRef} from 'react';
import '../../assets/common.css';
import styles from './index.module.css';
import { baseInfo, checkLogin, handleSharePic, openNewPage} from '../../utils/util';
import { getGlobalEvent } from '../../utils/eventEmitter';

import { Toast } from '@cola/Toast';
import LightMobileCall from '@kugou/light-mobilecall';
import share from '@kugou/share';

// import taskImg from '../../assets/image/taskImg.png';
import titleImg from '../../assets/image/titleImg.png';
import { taskReward } from '../../assets/api';
import mobileLog from '../../utils/mobileLog';
import { apmLog } from '../../utils/apmLog';

const TASK_BTNTEXT_MAP = {
  1: '开会员',
  2: '开会员',
  3: '去领养',
  4: '去喂养',
  5: '去聊天',
  6: '去签到',
  7: '去分享',
  8: '去浏览',
  default: '去完成'
};

const Tasks = (props) => {
  const [isLowVersion, setIsLowVersion] = useState(null); 
  const { tasks = [], taskConfig = [], shareConfig = [], vipUrl = '', vipIcon = '', useSharePic='', isTaskSubmitting = false, iOS_TARGET_VERSION = '', 
    Android_TARGET_VERSION = '' } = props;
  const [taskList, setTaskList] = useState([]);
  const [showLoading, setshowLoading] = useState(true);
  const [sharePicStatus, setSharePicStatus] = useState('loading');
  const eventEmitter = getGlobalEvent();
  let timerId = null;
  const sharePicCleanupRef = useRef(null);

  //任务标题
  const getTaskTitle = (taskName, curNum, taskNum, taskType) => {
    return taskType !== 1 ? `${taskName} (${curNum}/${taskNum})` : taskName;
  };

  //任务按钮文字
  const getTaskBtnText = (taskType) => {
    return TASK_BTNTEXT_MAP[taskType] || TASK_BTNTEXT_MAP.default;
  };

  const openVip = () => {
    const jumpUrl = vipUrl;
    LightMobileCall.mobileCall(123, { url: jumpUrl, browser: 4 });
  }
  // const openSvip = () =>{
  //   const jumpUrl = SvipUrl;
  //   LightMobileCall.mobileCall(123, { url: jumpUrl, browser: 0 });
  // }

const getKgClientVersion = async () => {
    if (isLowVersion !== null) return isLowVersion;

    const TARGET_VERSION = LightMobileCall.isIOS ? (iOS_TARGET_VERSION) : (Android_TARGET_VERSION);
    return new Promise((resolve) => {
      LightMobileCall.mobileCall(122, {}, (response) => {
        try {
          const currentVersion = response?.status === 1 ? Number(response.version) : 0;
          const isLow = currentVersion <= Number(TARGET_VERSION);
        
          setIsLowVersion(isLow);
          resolve(isLow); 
        } catch (error) {
          // 处理版本号出错：默认视为低版本
          console.error('处理酷狗版本号时出错:', error);
          setIsLowVersion(true);
          resolve(true);
        }
      });
    });
  };

  //宠物相关任务跳转
  const jumpToTaskPage = async(taskType) => {
    // const jumpUrl = petTaskUrl;
    // LightMobileCall.mobileCall(123, { url: jumpUrl, browser: 0 });
    try {
      const isLow = await getKgClientVersion();
      if (isLow) {
      Toast.info({ content: '当前酷狗版本过低，请升级后再操作' });
      return;
      }
      const targetTab = taskType === 5 ? 0 : 1;
      openNewPage(targetTab);
    } catch (error) {
      Toast.info({ content: '操作失败，请稍后重试' });
    }
  };

  //定时刷新任务状态
  // const updateActivityInfo = () => {
  //  clearTimeout(timerId);
  //  timerId = setTimeout(updateActivityInfo, 30000);
  //  eventEmitter.emit('refresh');
  // };

  //处理任务点击，传递任务信息
  const handleTaskClick = async (task) => {
    const { curNum, taskNum, isAwarded, taskType, taskId } = task;
    
    const isLoggedIn = await checkLogin();
    
    if (!isLoggedIn) return;
    if (isAwarded) return;

    //可领取奖励的
    if (curNum >= taskNum && !isAwarded) {
      mobileLog({
        a: 23320001,          
        b: '点击',      
        ft: '春节挖宝活动页',  
        r: '养狗', 
        svar1: '4', 
        ivar1: taskId 
      });
      const toast = Toast.loading({
      duration: 0,    // 不自动关闭，手动调用remove()
      mask: true,     // 遮罩，防止重复点击
      content: '领取中...',
    });
    try {
          const res = await taskReward(taskId); // 获取返回值
          
          if (res?.data?.code === 0) {
            apmLog({
              typeid: 111645,
              state: 1,
              para: 14,
              page: 0
            });
            eventEmitter.emit('refresh'); // 立即刷新
            Toast.info({ content: '领取成功' });
          } else {
            // 服务端业务错误
            const getbaseInfo = await baseInfo();
            apmLog({
              typeid: 111645,
              state: 0,
              para: 14,
              te: "E2",
              position: "06",
              fs: `${res?.data?.code || 999}_14`,
              hash: `任务ID: ${taskId}，错误：${res?.data?.msg || '任务奖励领取失败'}`,
              interfaceurl: "/kugoupet/activity/digTaskReward",
              realtime1: window.location.href,
              page: getbaseInfo?.userid || 0
            });
            Toast.info({ content: '领取失败，请稍后重试' });
          }
        } catch (err) {
          // 网络错误
          const getbaseInfo = await baseInfo();
          apmLog({
            typeid: 111645,
            state: 0,
            para: 14,
            te: "E1",
            position: "06",
            fs: `${err?.code || 999}_14`,
            hash: `任务ID: ${taskId}，错误：${err.msg || err.message || '任务奖励领取失败'}`,
            interfaceurl: "/kugoupet/activity/digTaskReward",
            realtime1: window.location.href,
            page: getbaseInfo?.userid || 0
          });
          Toast.info({ content: '领取失败，请稍后重试' });
        } finally {
          toast.remove();
        }
        return;
      }

      if (taskType !== 7) { 
        mobileLog({
          a: 23320001,
          b: '点击',
          ft: '春节挖宝活动页',
          r: '养狗',
          svar1: '3',      
          ivar1: taskId   
        });
      }

    //触发任务时，向父组件传递任务信息，父组件统一监听页面返回
    // eventEmitter.emit('taskTriggered', {
    //   taskId,
    //   taskType
    // });

    if ([1,2,3,4,5,6].indexOf(taskType)) {
      // eventEmitter.emit('taskTriggered'); // 无参数
    }

    //任务跳转逻辑
    switch (taskType) {
      // case 1:
      //   openSvip();
      //   break;
      case 2:
        openVip();
        break;
      case 3:
      case 4:
      case 5:
      case 6:
        jumpToTaskPage(taskType);
        break;
      case 7:
        mobileLog({
          a: 23320001,
          b: '点击',
          ft: '春节挖宝活动页',
          r: '养狗',   // 行为描述
          svar1: '2',      // 场景标识：1=点击分享
          ivar1: taskId    // 任务ID：必传（分享属于特定任务）
        });
        if (sharePicStatus === 'loading') {
          Toast.info({ content: '分享图加载中，请稍候' });
          return;
        }
        
        window.isClickShareBtn = 1;
        share.shareAll();

        break;
      case 8:
        //浏览任务跳转
        const browseUrl = task.jumpUrl;
        if (!browseUrl) {
          Toast.info({ content: "请稍后重试" });
          return;
        }
        LightMobileCall.mobileCall(123, {
        url: browseUrl,
        browser: 4
        });
        eventEmitter.emit('browseTaskComplete');
        break;
      default:
        break;
    }
  };

  //任务列表
  const renderTaskList = () => {
    if (taskList.length === 0) {
      return (
        <div className={styles.emptyTask} id="id_3_5">
          {showLoading? <div className= {styles.loadingtxt}>加载中，请稍候...</div> : null}
        </div>
      );
    }

    return taskList.map((item, index) => {
      const { taskType, taskName, taskDesc, curNum, taskNum, isAwarded } = item;
      const hasFinish = isAwarded;
      const canClaim = curNum >= taskNum && !isAwarded;
      const tip = Array.isArray(taskDesc) ? taskDesc[0] : `${taskDesc}`;
      const taskTitle = getTaskTitle(taskName, curNum, taskNum, taskType);

      return (
        <div className={styles.taskItem} key={`taskItem${index}`}>
          <div className={styles.taskContent}>
            <div className={styles.taskTitle}>{taskTitle}</div>
            <div className={styles.taskDesc}>{tip}</div>
          </div>

          {hasFinish ? (
            <button className={`${styles.finishBtn} ${styles.disable}`}>已领取</button>
          ) : canClaim ? (
            <button className={styles.taskBtn} onClick={() => handleTaskClick(item)} disabled={isTaskSubmitting} >
              <p>领取奖励</p>
            </button>
          ) : (
            <button className={taskType === 2 ? styles.VipBtn : styles.taskBtn} onClick={() => handleTaskClick(item)} disabled={isTaskSubmitting} >
              {taskType === 2 && (
                <img
                  src={vipIcon}
                  alt="会员图标"
                  className={styles.taskBtnIcon}
                />
              )}
              <p>{getTaskBtnText(taskType)}</p>
            </button>
          )}
        </div>
      );
    });
  };

  //监听tasks/taskConfig变化，合并任务数据
  useEffect(() => {
    if (taskConfig.length === 0) return;

    const mergedTasks = taskConfig.map(config => {
      let userTask = undefined;
      for (let i = 0; i < tasks.length; i++) {
        const currentTask = tasks[i];
        if (currentTask.taskId === config.taskId) {
          userTask = currentTask;
          break;
        }
      }
      userTask = userTask || {};
      return {
        taskId: config.taskId,
        taskType: config.taskType,
        taskName: config.taskDesc,
        taskDesc: [`完成任务可获得${config.digNum || 0}次挖宝机会`],
        taskNum: config.taskNum,
        digNum: config.digNum,
        refreshType: 1,
        jumpType: config.jumpType,
        jumpDesc: config.jumpDesc,
        jumpUrl: config.jumpUrl || "",
        curNum: userTask.curNum || 0,
        isAwarded: userTask.isAwarded || false,
        isClaiming: false
      };
    });

    setTaskList(mergedTasks);
    setshowLoading(false);
  }, [tasks, taskConfig]);

  //初始化
  useEffect(() => {
    sharePicCleanupRef.current = handleSharePic({
      useSharePic: useSharePic,
      defaultShareConfig: shareConfig,
      onStatusChange: (status) => {
        setSharePicStatus(status);
      }
    })
    // initShareConfig();
    // initPageTrack();
    // eventEmitter.on('refresh', updateActivityInfo);
    // updateActivityInfo();

    return () => {
      void sharePicCleanupRef.current?.(); 
      if (timerId) clearTimeout(timerId);
    };
  }, [useSharePic, shareConfig]);

  return (
    <div className={styles.wrap}>
      {/* <img className={styles.taskImg} src={taskImg} alt='任务页面背景图' /> */}
      <img className={styles.titleImg} src={titleImg} alt='任务页面标题' />
      <div className={styles.taskContainer}>
        {renderTaskList()}
      </div>
    </div>
  );
};

export default Tasks;