import React, { useEffect, useState, useRef} from 'react';
import '../../assets/common.css';
import styles from './index.module.css';
import { baseInfo, checkLogin, handleSharePic, openNewPage} from '../../utils/util';
import { getGlobalEvent } from '../../utils/eventEmitter';

import { Toast } from '@cola/Toast';
import LightMobileCall from '@kugou/light-mobilecall';
import share from '@kugou/share';

import titleImg from '../../assets/image/titleImg.png';
import { lotteryTaskReward } from '../../assets/api';
import mobileLog from '../../utils/mobileLog';
import { apmLog } from '../../utils/apmLog';

const TASK_BTNTEXT_MAP = {
  1: '去领养',
  2: '去喂食',
  3: '去对话',
  4: '去签到',
  5: '去听歌',
  6: '去收藏',
  7: '去装扮',
  8: '去分享',
  9: '开会员',
  default: '去完成'
};

const Tasks = (props) => {
  const [isLowVersion, setIsLowVersion] = useState(null); 
  const { 
    tasks = [], 
    shareConfig = [],
    // taskConfig = [], 
    // vipUrl = '', 
    // vipIcon = '', 
    useSharePic='', 
    isTaskSubmitting = false, 
    iOS_TARGET_VERSION = '', 
    Android_TARGET_VERSION = '' 
  } = props;
  const [taskList, setTaskList] = useState([]);
  const [showLoading, setshowLoading] = useState(true);
  const [sharePicStatus, setSharePicStatus] = useState('loading');
  const eventEmitter = getGlobalEvent();
  let timerId = null;
  const sharePicCleanupRef = useRef(null);
  const shareDataRef = useRef(null);

  const getTaskTitle = (taskName, curNum, taskNum, taskType) => {
    // return taskType !== 1 ? `${taskName} (${curNum}/${taskNum})` : taskName;
    return `${taskName} (${curNum}/${taskNum})`;
  };

  const getTaskBtnText = (taskType) => {
    return TASK_BTNTEXT_MAP[taskType] || TASK_BTNTEXT_MAP.default;
  };

  const getKgClientVersion = async () => {
    if (isLowVersion !== null) return isLowVersion;
    const TARGET_VERSION = LightMobileCall.isIOS ? iOS_TARGET_VERSION : Android_TARGET_VERSION;
    return new Promise((resolve) => {
      LightMobileCall.mobileCall(122, {}, (response) => {
        try {
          const currentVersion = response?.status === 1 ? Number(response.version) : 0;
          const isLow = currentVersion <= Number(TARGET_VERSION);
          setIsLowVersion(isLow);
          resolve(isLow); 
        } catch (error) {
          console.error('处理酷狗版本号时出错:', error);
          setIsLowVersion(true);
          resolve(true);
        }
      });
    });
  };

  const jumpToPetPage = async(taskType) => {
    try {
      const isLow = await getKgClientVersion();
      if (isLow) {
        Toast.info({ content: '当前酷狗版本过低，请升级后再操作' });
        return;
      }
      const targetTab = taskType === 1 ? 0 : 1;
      openNewPage(targetTab);
    } catch (error) {
      Toast.info({ content: '操作失败，请稍后重试' });
    }
  };
  const handlePetChatTask = async(taskType) => {
    try {
      const isLow = await getKgClientVersion();
      if (isLow) {
        Toast.info({ content: '当前酷狗版本过低，请升级后再操作' });
        return;
      }
      const targetTab = 0;
      openNewPage(targetTab);
    } catch (error) {
      Toast.info({ content: '操作失败，请稍后重试' });
    }
  };

  // handlePetChatTask = () => {
  //   const targetTab = 1;
  //   openNewPage(targetTab);
  // };

  const handleListenTask = () => {
    LightMobileCall.mobileCall(1303, {}, (res) => {
      console.log('客户端的返回值', res)
      const parsedRes = res || {};
     
      // try {
      //   res = JSON.parse(res);
      // } catch (error) {
      //   res = {};
      // }
      if (parsedRes?.songNum > 0) {
        LightMobileCall.mobileCall(725, { animated: 1 });
      } else {
        LightMobileCall.mobileCall(126, { tab: 43 });
      }
    });
  };

  const handleTaskClick = async (task) => {
    const { curNum, taskNum, isAwarded, taskType, taskId} = task;
    
    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) return;
    if (isAwarded) return;

    if (curNum >= taskNum && !isAwarded) {
      mobileLog({
        a: 1134954,
        b: '点击',
        ft: '贵族摇奖机页面',
        r: '养狗',
        svar1: '4',
        ivar1: taskId
      });
      const toast = Toast.loading({
        duration: 0,
        mask: true,
        content: '领取中...',
      });
      try {
        const res = await lotteryTaskReward(taskId);
        if (res?.data?.code === 0) {
          apmLog({
            typeid: 111645,
            state: 1,
            para: 14,
            page: 0
          });
          eventEmitter.emit('refresh');
          Toast.info({ content: '领取成功' });
        } else {
          const getbaseInfo = await baseInfo();
          apmLog({
            typeid: 111645,
            state: 0,
            para: 14,
            te: "E2",
            position: "06",
            fs: `${res?.data?.code || 999}_14`,
            hash: `任务ID: ${taskId}，错误：${res?.data?.msg || '任务奖励领取失败'}`,
            interfaceurl: "/kugoupet/activity/lotteryTaskReward",
            realtime1: window.location.href,
            page: getbaseInfo?.userid || 0
          });
          Toast.info({ content: '领取失败，请稍后重试' });
        }
      } catch (err) {
        const getbaseInfo = await baseInfo();
        apmLog({
          typeid: 111645,
          state: 0,
          para: 14,
          te: "E1",
          position: "06",
          fs: `${err?.code || 999}_14`,
          hash: `任务ID: ${taskId}，错误：${err.msg || err.message || '任务奖励领取失败'}`,
          interfaceurl: "/kugoupet/activity/lotteryTaskReward",
          realtime1: window.location.href,
          page: getbaseInfo?.userid || 0
        });
        Toast.info({ content: '领取失败，请稍后重试' });
      } finally {
        toast.remove();
      }
      return;
    }

    mobileLog({
      a: 1134954,
      b: '点击',
      ft: '贵族摇奖机页面',
      r: '养狗',
      svar1: '3',
      ivar1: taskId
    });

    switch (taskType) {
      case 1:
      case 2:
      case 4:
      case 7:
      // case 3:
        jumpToPetPage(taskType);
        break;
      case 3:
      // case 7:
        handlePetChatTask();
        break;
      case 5:
        handleListenTask();
        break;
      case 6:
        handleListenTask();
        // Toast.info({ content: '请前往酷狗歌曲页，收藏1首歌即可完成任务' });
        break;
            case 8: {
        mobileLog({
          a: 1134954,
          b: '点击',
          ft: '贵族摇奖机页面',
          r: '养狗',
          svar1: '2'
        });
        if (sharePicStatus === 'loading') {
          Toast.info({ content: '分享图加载中，请稍候' });
          return;
        }
        window.isClickShareBtn = 1;
        const config = shareDataRef.current;
        if (config) {
          const isImageShare = config.type === 4 && config.img;
          LightMobileCall.mobileCall(115, {
            type: isImageShare ? 4 : 3,
            shareData: {
              linkUrl: encodeURIComponent(config.url || window.location.href),
              title: config.title || document.title,
              content: config.content || '',
              ...(isImageShare
                ? { imageData: config.img }
                : { picUrl: config.img || '' }),
              copyContent: config.copyContent || '',
              showXhs: config.showXhs !== undefined ? config.showXhs : 1,
              xhsTitle: config.xhsTitle || '',
              xhsContent: config.xhsContent || '',
              xhsPicUrl: config.xhsPicUrl || '',
            }
          });
        } else {
          share.shareAll();
        }
        break;
      }
        default:
    }
  };

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
        <div className={styles.taskItem} key={`taskItem-${index}-${item.taskId}`}>
          <div className={styles.taskContent}>
            <div className={styles.taskTitle}>{taskTitle}</div>
            <div className={styles.taskDesc}>{tip}</div>
          </div>

          {hasFinish ? (
            <button className={`${styles.finishBtn} ${styles.disable}`} disabled>已领取</button>
          ) : canClaim ? (
            <button 
              className={styles.taskBtn} 
              onClick={() => handleTaskClick(item)} 
              disabled={isTaskSubmitting} 
            >
              <p>领取</p>
            </button>
          ) : (
            <button 
              className={styles.taskBtn} 
              onClick={() => handleTaskClick(item)} 
              disabled={isTaskSubmitting} 
            >
              <p>{getTaskBtnText(taskType)}</p>
            </button>
          )}
        </div>
      );
    });
  };

  useEffect(() => {
    if (tasks.length === 0) {
      setTaskList([]);
      setshowLoading(false);
      return;
    }

    const processedTasks = tasks.map(task => ({
      ...task,
      taskDesc: [`完成任务可获得${task.lotteryNum || 0}次摇奖机会`]
    }));

    setTaskList(processedTasks);
    setshowLoading(false);
  }, [tasks]);

  useEffect(() => {
    sharePicCleanupRef.current = handleSharePic({
      useSharePic: useSharePic,
      defaultShareConfig: shareConfig,
      onStatusChange: (status, finalConfig) => {
        setSharePicStatus(status);
        if (finalConfig) {
          shareDataRef.current = finalConfig;
        }
      }
    })

    return () => {
      void sharePicCleanupRef.current?.(); 
      if (timerId) clearTimeout(timerId);
    };
  }, [useSharePic, shareConfig]);

  return (
    <div className={styles.wrap}>
      <img className={styles.titleImg} src={titleImg} alt='任务页面标题' />
      <div className={styles.taskContainer}>
        {renderTaskList()}
      </div>
    </div>
  );
};

export default Tasks;