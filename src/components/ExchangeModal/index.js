import React from 'react';
import { Toast } from '../../utils/common';
import styles from './index.module.css';
import prize from './images/prize.png';
// 新增：引入兑换所需的API和工具
import { getLotteryRewardList } from '../../assets/api';
import LightMobileCall from '@kugou/light-mobilecall';

const ExchangeModal = ({ shareConfig, exchangeCode, onClose, visible = false }) => {
  const currentCode = exchangeCode || '暂无兑换码';

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

  const handleExchange = async () => {
    try {
      const res = await getLotteryRewardList();
      // 校验接口返回合法性
      if (!res?.data || res.data.code !== 0 || !Array.isArray(res.data.data?.rewardList)) {
        Toast('奖品信息获取失败，请稍后重试');
        return;
      }
      // 根据兑换码匹配奖品
      const targetPrize = res.data.data.rewardList.find(
        item => item.redeemCode === currentCode
      );
      if (!targetPrize) {
        Toast('未找到对应奖品');
        return;
      }
      // 判断URL是否有效（兼容空字符串、全空格）
      const isValidUrl = targetPrize.url && targetPrize.url.trim() !== '';
      if (isValidUrl) {
        // 跳转链接
        LightMobileCall.mobileCall(123, { url: targetPrize.url, browser: 4 });
      } else {
        // 无链接时提示
        Toast('暂无跳转链接');
      }
    } catch (error) {
      console.error('兑换跳转失败:', error);
      Toast('兑换跳转失败，请稍后重试');
    }
  };

  const onMaskClick = () => {
    onClose && onClose();
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