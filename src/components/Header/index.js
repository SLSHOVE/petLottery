import React, { useState, useEffect, useMemo, use } from 'react';
import styles from './index.module.css';

// 保留所有切图导入
import bannerBg from '../../assets/image/header/banner-bg.png';
import middleBg from '../../assets/image/header/middle-bg.png';
import gridWrapper from '../../assets/image/header/grid-wraper2.png';
import gridBg from '../../assets/image/header/grid-bg.png';
import ruleBtn from '../../assets/image/header/rule-btn.png';
import prizeBtn from '../../assets/image/header/prize-btn.png';
import chanceIcon from '../../assets/image/header/wa.png';
import lightImg from '../../assets/image/header/lightImg.png';
import lightImg1 from '../../assets/image/header/lightImg1.png';

// 保留气泡图片导入
import pop1 from '../../assets/image/pops/pop1.png';
import pop2 from '../../assets/image/pops/pop2.png';
import pop3 from '../../assets/image/pops/pop3.png';
import pop4 from '../../assets/image/pops/pop4.png';
import pop5 from '../../assets/image/pops/pop5.png';
// import pop6 from '../../assets/image/pops/pop6.png';
// import pop7 from '../../assets/image/pops/pop7.png';
// import pop8 from '../../assets/image/pops/pop8.png';
import pop9 from '../../assets/image/pops/pop9.png';
// import pop10 from '../../assets/image/pops/pop10.png';

// 气泡图片数组
const POP_IMAGES = [pop1, pop2, pop3, pop4, pop5, pop9];

/**
 * 头部组件 - 春节抽奖活动（保留UI，移除格子点击玩法）
 * @param {number} chanceCount - 抽奖机会次数
 * @param {function} onRuleClick - 活动规则点击回调
 * @param {function} onPrizeClick - 我的奖品点击回调
 */
const Header = (props) => {
  const { 
    chanceCount = 5, 
    onRuleClick,
    onPrizeClick,
    dataInited = false
  } = props;

  // 保留气泡图片状态
  const [bubbleImages, setBubbleImages] = useState(() => {
    const shuffled = [...POP_IMAGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });
  const [currentLightImg, setCurrentLightImg] = useState(lightImg); // 灯光图片交替
  const [isReady, setIsReady] = useState(false);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);

  // 保留网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkAvailable(true);
    };
    const handleOffline = () => {
      setIsNetworkAvailable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 保留气泡随机更换逻辑
  useEffect(() => {
    const randomReplaceBubble = () => {
      if (!isNetworkAvailable) return;
      setBubbleImages(prev => {
        const newImages = [...prev];
        const replaceIndex = Math.floor(Math.random() * 3);
        const unusedImages = POP_IMAGES.filter(img => !newImages.includes(img));
        if (unusedImages.length > 0) {
          const newImage = unusedImages[Math.floor(Math.random() * unusedImages.length)];
          newImages[replaceIndex] = newImage;
        }
        return newImages;
      });
    };

    const timer = setInterval(randomReplaceBubble, 5000);
    return () => clearInterval(timer);
  }, [isNetworkAvailable]);

  //灯管图片交替显示
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLightImg(prev => 
        prev === lightImg ? lightImg1 : lightImg
      )
    }, 1000);
    return () => clearInterval(timer)
  },[])

  // 保留图片加载逻辑
  useEffect(() => {
    const baseImages = [
      bannerBg, middleBg, gridWrapper, gridBg, 
      ruleBtn, prizeBtn, chanceIcon,
      ...POP_IMAGES
    ];

    const loadImg = (src) => new Promise(resolve => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = () => {
        setIsNetworkAvailable(false);
        resolve();
      };
    });

    Promise.all(baseImages.map(loadImg)).then(() => {
      setIsReady(true);
    });
  }, []);

  const handleBubbleError = (e) => {
    e.target.style.visibility = "hidden";
    setIsNetworkAvailable(false);
  };

  return (
    <div className={styles.header}> 
      {/* 加载中状态 */}
      {!isReady ? (
        <div className={styles.loading}></div>
      ) : (
        <div className={styles.header}>
          {/* 保留气泡动画层 */}
          <div className={styles.bubblesContainer}>
            <img 
              className={`${styles.bubble} ${styles.bubbleLeft}`} 
              src={bubbleImages[0]} 
              alt="" 
              onError={handleBubbleError}
            />
            <img 
              className={`${styles.bubble} ${styles.bubbleMiddle}`} 
              src={bubbleImages[1]} 
              alt="" 
              onError={handleBubbleError}
            />
            <img 
              className={`${styles.bubble} ${styles.bubbleRight}`} 
              src={bubbleImages[2]} 
              alt="" 
              onError={handleBubbleError}
            />
          </div>

          {/* 保留背景图层 */}
          <img className={styles.bannerBg} src={bannerBg} alt="" />
          {/* <img className={styles.middleBg} src={middleBg} alt="" /> */}
          <img className={styles.lightImg} src={currentLightImg} alt="" />
          <button className={styles.raffleBtn}/>

          {/* 保留右侧悬浮按钮 */}
          <div className={styles.sideButtons}>
            <img 
              className={styles.sideBtn} 
              src={ruleBtn} 
              alt="活动规则" 
              onClick={onRuleClick}
            />
            <img 
              className={styles.sideBtn} 
              src={prizeBtn} 
              alt="我的奖品" 
              onClick={onPrizeClick}
            />
          </div>
          
          {/* 保留机会数显示栏（修改文案为抽奖） */}
          <div className={styles.chanceBar}>
            <div className={styles.chanceContent}>
              <span className={styles.chanceLabel}>还可抽取<span className={styles.chanceNum}>{chanceCount}</span>次</span>
            </div>
            {/* <div className={styles.chanceCount}>
              <img 
                className={styles.chanceIcon} 
                src={chanceIcon} 
                alt="抽奖机会" 
              />
              <span className={styles.chanceNum}>×{chanceCount}</span>
            </div> */}
          </div>

          {/* 保留格子区域背景（移除格子点击，改为占位） */}
          {/* <div className={styles.gridSection}>
            <img className={styles.gridWrapper} src={gridWrapper} alt="" />
            <img className={styles.gridBg} src={gridBg} alt="" />
            
            抽奖区域占位（你后续替换为抽奖组件
            <div className={styles.lotteryPlaceholder}>
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Header;