import React, { Component } from 'react';
import styles from './index.module.css';

import bannerBg from '../../assets/image/header/banner-bg.png';
import middleBg from '../../assets/image/header/middle-bg.png';
import gridWrapper from '../../assets/image/header/grid-wraper2.png';
import gridBg from '../../assets/image/header/grid-bg.png';
import ruleBtn from '../../assets/image/header/rule-btn.png';
import prizeBtn from '../../assets/image/header/prize-btn.png';
// import chanceIcon from '../../assets/image/header/wa.png';
import lightImg from '../../assets/image/header/lightImg.png';
import lightImg1 from '../../assets/image/header/lightImg1.png';

import pop1 from '../../assets/image/pops/pop1.png';
import pop2 from '../../assets/image/pops/pop2.png';
import pop3 from '../../assets/image/pops/pop3.png';
import pop4 from '../../assets/image/pops/pop4.png';
import pop5 from '../../assets/image/pops/pop5.png';
import pop9 from '../../assets/image/pops/pop9.png';

import prize1 from '../../assets/image/prizes/prize1.png';
import prize2 from '../../assets/image/prizes/prize2.png';
import prize3 from '../../assets/image/prizes/prize3.png';
import prize4 from '../../assets/image/prizes/prize4.png';
import prize5 from '../../assets/image/prizes/prize5.png';
import defaultPrize from '../../assets/image/prizes/default.png';

const PRIZE_LIST = [prize1, prize2, prize3, prize4, prize5];
const ROLL_ORDER = [0,1,2,3,4,0,1,2,3,4];
const ROLL_SPEED = 150;
const START_INTERVAL = 250;
const STOP_DELAY = [2200, 3000, 3800];
const POP_IMAGES = [pop1, pop2, pop3, pop4, pop5, pop9];

class Header extends Component {
  state = {
    bubbleImages: [],
    currentLightImg: lightImg,
    isReady: false,
    isRaffling: false,
    isNetworkAvailable: true,
    slots: [
      { rolling: false, index: 0, targetIndex: 0 },
      { rolling: false, index: 0, targetIndex: 0 },
      { rolling: false, index: 0, targetIndex: 0 },
    ],
    hasStartedRaffle: false,
  };

  rollTimers = [null, null, null];
  startDelayTimers = [null, null, null];
  stopDelayTimers = [null, null, null];
  lightTimer = null;
  bubbleTimer = null;
  raffleResult = null;

  handleOnline = () => {
    this.setState({ isNetworkAvailable: true });
  };

  handleOffline = () => {
    this.setState({ isNetworkAvailable: false });
  };

  //气泡图片加载失败处理
  handleBubbleError = (e) => {
    e.target.style.visibility = "hidden";
    this.setState({ isNetworkAvailable: false });
  };

  componentDidMount() {
    const shuffled = [...POP_IMAGES].sort(() => Math.random() - 0.5);
    this.setState({ bubbleImages: shuffled.slice(0, 3) });
    this.loadAllImages();
    this.initLightAnimation();
    this.initBubbleAnimation();

    //网络状态监听事件
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    this.rollTimers.forEach(timer => timer && clearInterval(timer));
    this.startDelayTimers.forEach(timer => timer && clearTimeout(timer));
    this.stopDelayTimers.forEach(timer => timer && clearTimeout(timer));
    this.lightTimer && clearInterval(this.lightTimer);
    this.bubbleTimer && clearInterval(this.bubbleTimer);

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  // 预加载所有图片
  loadAllImages = () => {
    const allImages = [
      bannerBg, middleBg, gridWrapper, gridBg,
      ruleBtn, prizeBtn, lightImg, lightImg1,
      ...POP_IMAGES,
      ...PRIZE_LIST,
      defaultPrize
    ];

    Promise.all(allImages.map(src => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = () => {
          //图片加载失败时标记网络不可用
          this.setState({ isNetworkAvailable: false });
          resolve();
        };
      });
    })).then(() => {
      this.setState({ isReady: true });
      this.props.onHeaderReady && this.props.onHeaderReady();
    });
  };

  //背景灯光动画
  initLightAnimation = () => {
    this.lightTimer = setInterval(() => {
      this.setState(prev => ({
        currentLightImg: prev.currentLightImg === lightImg ? lightImg1 : lightImg
      }));
    }, 800);
  };

  //气泡漂浮动画
  initBubbleAnimation = () => {
    this.bubbleTimer = setInterval(() => {
      if (!this.state.isNetworkAvailable) {
        return;
      }

      this.setState(prev => {
        const newImages = [...prev.bubbleImages];
        const replaceIdx = Math.floor(Math.random() * 3);
        const unused = POP_IMAGES.filter(img => !newImages.includes(img));
        if (unused.length > 0) {
          newImages[replaceIdx] = unused[Math.floor(Math.random() * unused.length)];
        }
        return { bubbleImages: newImages };
      });
    }, 4000);
  };

  //rewardId转奖品索引
  getPrizeIndexByRewardId = (rewardId) => {
    return Math.max(0, Math.min(PRIZE_LIST.length - 1, (rewardId || 1) - 1));
  };

  getSlotImage = (slot) => {
    const { hasStartedRaffle } = this.state;

    if (!hasStartedRaffle) {
      return defaultPrize;
    }

    if (slot.rolling) {
      return PRIZE_LIST[ROLL_ORDER[slot.index]];
    }

    return PRIZE_LIST[slot.index];
  };

  //单个格子启动滚动
  startSingleSlot = (slotIdx) => {
    if (this.rollTimers[slotIdx]) clearInterval(this.rollTimers[slotIdx]);
    
    this.setState(prev => {
      const newSlots = [...prev.slots];
      newSlots[slotIdx] = {
        ...newSlots[slotIdx],
        rolling: true,
        // targetIndex: targetIndex,
        index: 0
      };
      return { slots: newSlots };
    });

    this.rollTimers[slotIdx] = setInterval(() => {
      this.setState(prev => {
        const newSlots = [...prev.slots];
        newSlots[slotIdx].index = (newSlots[slotIdx].index + 1) % ROLL_ORDER.length;
        return { slots: newSlots };
      });
    }, ROLL_SPEED);
  };

  //单个格子停止滚动
  stopSlotRoll = (slotIdx) => {
    clearInterval(this.rollTimers[slotIdx]);
    this.rollTimers[slotIdx] = null;

    this.setState((prev) => {
      const newSlots = [...prev.slots];
      newSlots[slotIdx].rolling = false;
      newSlots[slotIdx].index = newSlots[slotIdx].targetIndex;
      return { slots: newSlots };
    }, () => {
      const allStopped = this.state.slots.every(slot => !slot.rolling);
      if (allStopped) {
        setTimeout(() => {
          this.setState({ isRaffling: false });
          if (this.raffleResult?.onRaffleComplete) {
            this.raffleResult.onRaffleComplete();
          }
          this.raffleResult = null;
        }, 800);
      }
    });
  };

  //抽奖主逻辑
  handleRaffle = async () => {
    const { chanceCount, dataInited, onRaffle } = this.props;
    const { isRaffling, isReady } = this.state;

    if (isRaffling || !isReady || !dataInited) return;
    if (chanceCount <= 0) {
      onRaffle && onRaffle();
      return;
    }

    this.setState(prev => ({
      isRaffling: true,
      hasStartedRaffle: true,
      slots: prev.slots.map(slot => ({
        ...slot,
        targetIndex: 0
      }))
    }));
    this.raffleResult = null;

    //启动滚动动画
    this.startSingleSlot(0);
    this.startDelayTimers[1] = setTimeout(() => {
      this.startSingleSlot(1);
    }, START_INTERVAL);
    this.startDelayTimers[2] = setTimeout(() => {
      this.startSingleSlot(2);
    }, START_INTERVAL * 2);

    //调用父组件接口
    let apiResult = null;
    try {
      apiResult = await onRaffle();
    } catch (err) {
      this.stopSlotRoll(0);
      this.stopSlotRoll(1);
      this.stopSlotRoll(2);
      this.setState({ isRaffling: false });
      return;
    }

    if (!apiResult?.success) {
      this.stopSlotRoll(0);
      this.stopSlotRoll(1);
      this.stopSlotRoll(2);
      this.setState({ isRaffling: false });
      return;
    }

    this.raffleResult = apiResult;
    const targetIndex = this.getPrizeIndexByRewardId(apiResult.rewardId);

    this.setState(prev => {
      const newSlots = [...prev.slots];
      newSlots.forEach(slot => {
        slot.targetIndex = targetIndex;
      });
      return { slots: newSlots };
    });

    STOP_DELAY.forEach((delay, slotIdx) => {
      this.stopDelayTimers[slotIdx] = setTimeout(() => {
        this.stopSlotRoll(slotIdx);
      }, delay);
    });
  };

  render() {
    const { chanceCount = 0, onRuleClick, onPrizeClick } = this.props;
    const { bubbleImages, currentLightImg, isReady, isRaffling, slots } = this.state;

    return (
      <div className={styles.header}>
        {!isReady ? (
          <div className={styles.loading}></div>
        ) : (
          <div className={styles.headerContent}>
            {/* 气泡装饰 */}
            <div className={styles.bubblesContainer}>
              <img 
                className={`${styles.bubble} ${styles.bubbleLeft}`} 
                src={bubbleImages[0]} 
                alt="气泡" 
                onError={this.handleBubbleError} //气泡错误处理
              />
              <img 
                className={`${styles.bubble} ${styles.bubbleMiddle}`} 
                src={bubbleImages[1]} 
                alt="气泡" 
                onError={this.handleBubbleError}
              />
              <img 
                className={`${styles.bubble} ${styles.bubbleRight}`} 
                src={bubbleImages[2]} 
                alt="气泡" 
                onError={this.handleBubbleError}
              />
            </div>

            {/* 背景和灯光 */}
            <img className={styles.bannerBg} src={bannerBg} alt="背景" />
            <img className={styles.lightImg} src={currentLightImg} alt="灯光" />

            {/* 三个奖品格子 */}
            <div className={styles.prizeGrid}>
              <img
                className={`${styles.prizeImg} ${slots[0].rolling ? styles.rolling : ''}`}
                src={this.getSlotImage(slots[0])}
                alt="奖品"
              />
            </div>
            <div className={styles.prizeGrid1}>
              <img
                className={`${styles.prizeImg} ${slots[1].rolling ? styles.rolling : ''}`}
                src={this.getSlotImage(slots[1])}
                alt="奖品"
              />
            </div>
            <div className={styles.prizeGrid2}>
              <img
                className={`${styles.prizeImg} ${slots[2].rolling ? styles.rolling : ''}`}
                src={this.getSlotImage(slots[2])}
                alt="奖品"
              />
            </div>

            {/* 抽奖按钮 */}
            <button
              className={styles.raffleBtn}
              onClick={this.handleRaffle}
              disabled={isRaffling}
            />

            <div className={styles.sideButtons}>
              <img className={styles.sideBtn} src={ruleBtn} alt="活动规则" onClick={onRuleClick} />
              <img className={styles.sideBtn} src={prizeBtn} alt="我的奖品" onClick={onPrizeClick} />
            </div>

            <div className={styles.chanceBar}>
              <span className={styles.chanceLabel}>
                还可抽取<span className={styles.chanceNum}>{chanceCount}</span>次
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Header;