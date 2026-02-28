import React, {Component} from 'react';
import '../assets/common.css';
import styles from './MyWard.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import Titlebar from '../components/titlebar';
import LightMobileCall from '@kugou/light-mobilecall';
import { prizeMap ,cardMap} from '../utils/common';
import { getDigRewardList, getPetChatInfoCore} from '../assets/api';
import { Toast } from '@cola/Toast';
import { getGlobalEvent } from '../utils/eventEmitter';
import {openNewPage} from '../utils/util'
import SharePoster from '../components/SharePoster';
import mobileLog from '../utils/mobileLog';
import kg20EmptyContent from '@cola/KGImage/src/assets/kg20/empty-content.js'


const eventBus = getGlobalEvent();

// 图片资源
// import prizeIcon1 from '../assets/myward/prize-icon-1.png';
// import prizeIcon2 from '../assets/myward/prize-icon-2.png';
// import prizeIcon3 from '../assets/myward/prize-icon-3.png';


const data = combineSubmodule('Index');

// 模拟奖品数据
// const mockPrizeList = [
//   {
//     id: 1,
//     name: '宠物食物-小鸡腿 x1',
//     date: '2025-12-03  23:22',
//     icon: prizeIcon1,
//     actionUrl: ''
//   },
//   {
//     id: 2,
//     name: '新年限定宠物皮肤',
//     date: '2025-12-03  23:22',
//     icon: prizeIcon2,
//     actionUrl: ''
//   },
//   {
//     id: 3,
//     name: 'XXXX优惠券',
//     date: '2025-12-03  23:22',
//     icon: prizeIcon3,
//     actionUrl: ''
//   }
// ];

class MyWard extends Component {
  state = {
    // prizeList: mockPrizeList
    prizeList: [],
    isLoading: false,
    isListLoading: false
  };
  USEABLE_PRIZE_IDS = ['4001', '4002', '4003', '4004', '4005', '5001', '5002', '5003'];
  MILK_TEA_COUPON_IDS = ['1001', '1002']; // 奶茶券
  TAKEAWAY_COUPON_IDS = ['1003', '1004', '1005'];
  SHARE_CARD_IDS = ['2001', '2002', '2003', '3001', '3002', '3003']; 
  
  MILK_TEA_URL = this.props.MILK_TEA_URL;
  TAKEAWAY_URL = this.props.TAKEAWAY_URL;


  formatTime = (timestamp) => {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp * 1000); // 接口 time 是秒级，转毫秒级计算
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 补0（如1月→01）
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
    const res = await getDigRewardList();
    // console.log(res,'123')
    if (res?.data.code === 0 && Array.isArray(res.data?.data.rewardList)) {
      const formattedPrizeList = res.data?.data.rewardList.map(item => ({
        id: item.id,
        name: item.name || '',
        date: this.formatTime(item.time),
        icon: prizeMap[String(item.id)]?.src || kg20EmptyContent,
        actionUrl: ''
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
          a: 23320002,
          b: '曝光',
          ft: '春节挖宝各页面',
          r: '养狗',
          svar1:'3'
        });
  }

  // 返回上一页
  handleBack = () => {
    if (LightMobileCall.isIOS) {
      LightMobileCall.mobileCall(158, { type: 6 });
    } else {
      LightMobileCall.mobileCall(247, { count: 1, paramInfo: { type: 1 } });
    }
  };

  // 使用宠物相关奖品
  petHandleUse = async() => {
    const { isLoading } = this.state;
    if (isLoading) return;
    try {
      this.setState({ isLoading: true });
      // Toast.info({ content: "查询宠物状态中..." });
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

  //奶茶以及外卖券
  handleCouponUse = async(prize)=> {
    const { isLoading } = this.state;
    const prizeId = String(prize.id);
    if (isLoading) return;
    try{
      this.setState({isLoading: true})
      const jumpUrl = this.MILK_TEA_COUPON_IDS.indexOf(prizeId) 
        ? this.MILK_TEA_URL 
        : this.TAKEAWAY_URL;
      LightMobileCall.mobileCall(123, {
        url: jumpUrl,
        browser: 0 
      });
    }catch{
      //错误处理
    }finally{
      this.setState({isLoading: false})
    }
  }

  //卡片分享
  handelConfirmRewardModal = (prize) => {
  // 1. 拿当前选中的奖品ID（复用现有state，无额外判断）
  const prizeId = String(prize.id);

  // 2. 仅判断是否为分享目标ID（用你已定义的SHARE_CARD_IDS，无其他杂判断）
  if (this.SHARE_CARD_IDS.includes(prizeId)) {
    // 3. 复用prizeMap取图，触发分享（直接调用，无多余校验）
    eventBus.emit('share', {
      cardImage: cardMap[prizeId] || '',
      url: window.location.href
    });
  }
};

  // openNewPage = (targetTab)=>{
  //   if (LightMobileCall.isIOS) {
  //     LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
  //       if (!res || res.status === 0) {
  //         Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
  //       }
  //       this.setState({ isLoading: false });
  //     });
  //   } else {
  //      LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
  //       if (!res || res.status === 0) {
  //         Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
  //       }
  //     });
  //   }
  //  }

  renderPrizeItem = (prize) => {
    const prizeId = String(prize.id); 
    const isPetPrize = this.USEABLE_PRIZE_IDS.includes(prizeId);
    const isMilkTea = this.MILK_TEA_COUPON_IDS.includes(prizeId);
    const isTakeaway = this.TAKEAWAY_COUPON_IDS.includes(prizeId);
    const isShareCard = this.SHARE_CARD_IDS.includes(prizeId)

    return (
      <div className={styles.listItem} key={prize.id}>
        <img 
          className={styles.prizeIcon} 
          src={prize.icon} 
          alt={prize.name}
        />
        <div className={styles.prizeInfo}>
          <p className={styles.prizeName}>{prize.name}</p>
          <p className={styles.prizeDate}>{prize.date}</p>
        </div>
        {(isPetPrize || isMilkTea || isTakeaway || isShareCard) && (
          <button 
          className={styles.useBtn}
          onClick={() => 
              isPetPrize ? this.petHandleUse() 
              : (isMilkTea || isTakeaway) ? this.handleCouponUse(prize) 
              : isShareCard ? this.handelConfirmRewardModal(prize) 
              : null
            }
          >
          {isShareCard ? '去分享' : '去使用'}
        </button>
        )
        }
        
      </div>
    );
  };

  render() {
    const { prizeList,isListLoading } = this.state;
    const isInClient = LightMobileCall.isInClient();
    const sharePosterConfig = this.props.sharePosterConfig;

    return (
      <div className={styles.wrap} id="page">
        {/* 标题栏 - 客户端内使用原生标题栏 */}
        {isInClient ? <Titlebar title="我的奖品" showPlaceHolder={true} barConfig={{color: '#FFFFFF'}} forceDarkStatusBar={true} iconColor="#000000"/> : null}
        {/* 奖品列表 */}
        <div className={styles.listContainer}>
          {prizeList.length > 0 ? (
            <>
            {prizeList.map(this.renderPrizeItem)}
            {/* {prizeList.map(this.renderPrizeItem)} */}
            </>
          ) : (!isListLoading &&(
            <div className={styles.emptyState}>
              <img src={kg20EmptyContent} alt= "" className={styles.emptyImage} />
              <p className={styles.emptyText}>暂无奖品</p>
           </div>
          )
          )}
        </div>
        <SharePoster shareConfig={sharePosterConfig}/>
      </div>
    );
  }
}

MyWard.defaultProps = data;
export default MyWard;
