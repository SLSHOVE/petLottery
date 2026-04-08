import React from 'react';
import styles from './index.module.css';

// 导入切图
import decorImg from '../../assets/image/dailyLogin/daily-login-decor.png';
import closeBtn from '../../assets/image/dailyLogin/close-btn.png';

/**
 * 每日首次登录弹窗 - 恭喜获得挖宝机会
 * @param {boolean} visible - 是否显示弹窗
 * @param {function} onClose - 关闭弹窗回调
 * @param {function} onConfirm - 点击"立即挖宝"按钮回调
 */
const DailyLoginModal = (props) => {
  const { visible = false, onClose, onConfirm } = props;

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

  // 点击立即挖宝
  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  return (
    <div className={styles.modalMask} onClick={handleMaskClick}>
      <div className={styles.modalContainer}>
        {/* 关闭按钮 */}
        <img 
          className={styles.closeBtn} 
          src={closeBtn} 
          alt="关闭" 
          onClick={handleClose}
        />
        
        {/* 装饰图案 */}
        <img className={styles.decorImg} src={decorImg} alt="" />
        
        {/* 白色背景区域 */}
        <div className={styles.contentBg}>
          {/* 文字内容 */}
          <div className={styles.textContent}>
            恭喜获得一次挖宝机会！
          </div>
          
          {/* 立即挖宝按钮 */}
          <div className={styles.confirmBtn} onClick={handleConfirm}>
            <span className={styles.btnText}>立即挖宝</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLoginModal;
