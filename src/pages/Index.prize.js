import React, {Component} from 'react';
import '../assets/common.css';
import styles from './MyWard.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import Titlebar from '../components/titlebar';
import LightMobileCall from '@kugou/light-mobilecall';
import { prizeMap } from '../utils/common';
import { getLotteryRewardList, getPetChatInfoCore } from '../assets/api';
import { Toast } from '@cola/Toast';
// import { getGlobalEvent } from '../utils/eventEmitter';
import {openNewPage} from '../utils/util'
// import SharePoster from '../components/SharePoster';
import ExchangeModel from '../components/ExchangeModal';
import mobileLog from '../utils/mobileLog';
import kg20EmptyContent from '@cola/KGImage/src/assets/kg20/empty-content.js'

// const eventBus = getGlobalEvent();
const data = combineSubmodule('Index');

class MyWard extends Component {
  state = {
    prizeList: [],
    isLoading: false,
    isListLoading: false,
    showExchangeModel: false,
    currentRedeemCode: '' // 仅新增：存储当前兑换码
  };

  formatTime = (timestamp) => {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}  ${hours}:${minutes}`;
  };

  initData = async () => {
    if (this.state.isListLoading) return;
    this.setState({ isListLoading: true });
    const toast = Toast.loading({
      duration: 0, 
      mask: true, 
      content: '加载中，请稍候...' 
    });
    try{
      const res = await getLotteryRewardList();
      if (res?.data?.code === 0 && Array.isArray(res.data?.data?.rewardList)) {
        const formattedPrizeList = res.data?.data?.rewardList.map(item => ({
          id: item.rewardId,
          type: item.rewardType, // 仅新增：保留奖励类型
          name: item.name || '',
          date: this.formatTime(item.time),
          icon: prizeMap[String(item.rewardId)]?.src || kg20EmptyContent,
          url: item.url || '',
          redeemCode: item.redeemCode || '' // 仅新增：保留兑换码
        }));
        this.setState({ prizeList: formattedPrizeList });
      }
    }catch(error){
      Toast.info({ content: '获取奖品失败，请稍后重试' });
    }finally {
      toast.remove();
      this.setState({ isListLoading: false });
    }
  }

  componentDidMount() {
    this.initData();
    window.vs_finish && window.vs_finish();
    mobileLog({
          a: 1134953,
          b: '曝光',
          ft: '贵族摇奖机各页面',
          r: '养狗',
          svar1: '3'
        });
  }

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

  handleBtnClick = (config) => {
    const { link } = config;
    if (!link) return;
    LightMobileCall.mobileCall(123, { url: link, browser: 4 });
  };

  renderPrizeItem = (prize) => {
    const prizeId = String(prize.id); 
    const prizeType = prize.type;
    const isPrize1 = prizeId === '1' && prizeType === 1; // 仅修改：精准判断rewardId和rewardType均为1
    const isPrize2To4 = ['2', '3', '4'].includes(prizeId);
    const isPrize5 = prizeId === '5';
    const showUseBtn = isPrize1 || isPrize2To4 || isPrize5;

    return (
      <div className={styles.listItem} key={`${prize.id}_${prize.date}`}>
        <img 
          className={styles.prizeIcon} 
          src={prize.icon} 
          alt={prize.name}
        />
        <div className={styles.prizeInfo}>
          <p className={styles.prizeName}>{prize.name}</p>
          <p className={styles.prizeDate}>{prize.date}</p>
        </div>
        
        {showUseBtn && (
          <button 
            className={styles.useBtn}
            onClick={() => {
              if (isPrize1) {
                // 设置当前兑换码并打开弹窗
                this.setState({ 
                  showExchangeModel: true,
                  currentRedeemCode: prize.redeemCode 
                });
              } else if (isPrize2To4) {
                this.handleBtnClick({ link: prize.url });
              } else if (isPrize5) {
                this.petHandleUse();
              }
            }}
          >
            {isPrize5 ? '去喂养' : '去领取'}
          </button>
        )}
      </div>
    );
  };

  render() {
    const { prizeList, isListLoading, showExchangeModel, currentRedeemCode } = this.state;
    const isInClient = LightMobileCall.isInClient();
    const sharePosterConfig = this.props.sharePosterConfig;

    return (
      <div className={styles.wrap} id="page">
        {isInClient ? <Titlebar title="我的奖品" showPlaceHolder={true} barConfig={{color: '#FFFFFF'}} forceDarkStatusBar={true} iconColor="#000000"/> : null}
        
        <div className={styles.listContainer}>
          {prizeList.length > 0 ? (
            prizeList.map(this.renderPrizeItem)
          ) : (!isListLoading &&(
            <div className={styles.emptyState}>
              <img src={kg20EmptyContent} alt= "" className={styles.emptyImage} />
              <p className={styles.emptyText}>暂无奖品</p>
           </div>
          ))}
        </div>

        {showExchangeModel && (
          <ExchangeModel 
            shareConfig={sharePosterConfig}
            exchangeCode={currentRedeemCode}
            onClose={() => this.setState({ showExchangeModel: false })}
            onExchange={(redeemCode) => {
              const targetPrize = this.state.prizeList.find(item => item.redeemCode === redeemCode);
              this.handleBtnClick({ link: targetPrize?.url });
            }}
          />
        )}
      </div>
    );
  }
}

MyWard.defaultProps = data;
export default MyWard;