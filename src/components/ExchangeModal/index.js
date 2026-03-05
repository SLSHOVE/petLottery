import React, { useState, useEffect } from 'react';
import { Toast } from '../../utils/common';
import styles from './index.module.css';
// import LightMobileCall from '@kugou/light-mobilecall';
import { getGlobalEvent } from '../../utils/eventEmitter';
import prize from './images/prize.png'

const eventHub = getGlobalEvent();

const ExchangeModal = ({ shareConfig, exchangeCode, onClose, onExchange }) => {
  const [visible, setVisible] = useState(false);
  const currentCode = exchangeCode || '暂无兑换码';

  useEffect(() => {
    const handleShare = () => {
      setVisible(true);
    };

    eventHub.on('share', handleShare);
    return () => {
      eventHub.off('share', handleShare);
    };
  }, []);

  //使用父组件传入的兑换码
  const handleCopy = async () => {
    if (!currentCode || currentCode === '暂无兑换码') {
      Toast('暂无兑换码');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentCode);
        Toast('复制成功');
      } else {
        //兼容旧浏览器
        const input = document.createElement('input');
        input.value = currentCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        Toast('复制成功');
      }
    } catch (error) {
      console.error('复制失败:', error);
      Toast('复制失败');
    }
  };

  //去兑换操作
  const handleExchange = () => {
    //后续可添加跳转逻辑
    onExchange(currentCode);
  };

  // 保留原有关闭逻辑，同时兼容父组件的 onClose
  const onMaskClick = () => {
    setVisible(false);
    // 如果父组件传了 onClose，也执行（保证和父组件状态同步）
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.container} onClick={onMaskClick}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.closeBtn} onClick={onMaskClick}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M6 6L24 24M24 6L6 24" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        <>
          <img
            src={prize}
            className={styles.prize}
            alt=''
          />
          <h2 className={styles.exchangeTitle}>恭喜获得【富养包 1kg】免单券</h2>
          <div className={styles.codeRow}>
            <span className={styles.codeLabel}>兑换码 |</span>
            {/* 显示传入的兑换码 */}
            <span className={styles.codeText}>{currentCode}</span>
            <button className={styles.copyBtn} onClick={handleCopy}>复制</button>
          </div>
          <p className={styles.tipText}>复制兑换码并发送给店铺客服即可领取</p>
          <button className={styles.exchangeBtn} onClick={handleExchange}>去兑换</button>
        </>
      </div>
    </div>
  );
};

export default ExchangeModal;