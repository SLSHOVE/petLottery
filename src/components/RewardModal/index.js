import React, { useEffect } from 'react';
import styles from './index.module.css';

// 导入切图
import topBg from './images/top_bg.png';
import closeIcon from './images/close-icon.svg';
import ribbon from './images/ribbon.png'
import mobileLog from '../../utils/mobileLog';

/**
 * 奖励弹窗组件
 * @param {boolean} visible - 是否显示弹窗
 * @param {string} title - 主标题，如 "恭喜获得「新春祝福卡」"
 * @param {string} subtitle - 副标题，如 "文案产品提供"
 * @param {string} animalImage - 动物图片URL，支持两种尺寸
 * @param {string} buttonText - 按钮文字，默认 "立即查看"
 * @param {function} onClose - 关闭弹窗回调
 * @param {function} onConfirm - 点击按钮回调
 */
const RewardModal = (props) => {
  const { 
    visible = false, 
    title = '恭喜获得「新春祝福卡」',
    subtitle = '太棒了，您获得了新春祝福卡！',
    animalImage,
    buttonText = '立即查看',
    onClose,
    onConfirm,
    imgWidth = '100%',
    rewardId
  } = props;

  const targetRibbonIds = [5001, 5002, 5003];
  const needShowRibbon = targetRibbonIds.includes(Number(rewardId));

  useEffect(()=>{
    if(visible){
      mobileLog({
        a: 1134953,
        b: '曝光',
        ft: '贵族摇奖机各页面',
        r: '养狗',
        svar1: '4',
        ivar1: rewardId
      });
    }
  },[visible, rewardId])

  if (!visible) return null;

  // 点击遮罩层关闭
  const handleMaskClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  };

  // 点击关闭按钮
  const handleClose = () => {
    onClose && onClose();
  };

  // 点击按钮
  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  return (
    <div className={styles.modalMask} onClick={handleMaskClick}>
      <div className={styles.modalContainer}>
        <img 
          className={styles.closeBtn} 
          src={closeIcon} 
          alt="关闭" 
          onClick={handleClose}
        />
        
        <div className={styles.topSection}>
          <img className={styles.topBg} src={topBg} alt="" />
          
          {animalImage && (
            <div className={styles.animalWrapper}>
              {needShowRibbon ? (
                <>
                  <img 
                  className={styles.ribbonImg} 
                  src={ribbon} 
                  alt="" 
                  />
                  <img className={styles.animalSkinImg} src={animalImage} alt="" />
                </> 
              ) : (
                <img className={styles.animalImg} src={animalImage} style={{ width: imgWidth }} alt="" />
              )}
              {/* <img className={styles.animalImg} src={animalImage} style={{ width: imgWidth }} alt="" /> */}
            </div>
          )}
        </div>
        
        <div className={styles.contentBg}>
          <div className={styles.title}>{title}</div>
          
          {subtitle && (
            <div className={styles.subtitle}>{subtitle}</div>
          )}
          
          <div className={styles.confirmBtn} onClick={handleConfirm}>
            <span className={styles.btnText}>{buttonText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;