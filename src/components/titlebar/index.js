import React, { Component } from 'react';
import styles from './index.module.css';
import LightMobileCall from '@kugou/light-mobilecall';
import share from '@kugou/share';
// import { getGlobalEvent } from '../../utils/eventEmitter';
import { handleSharePic } from '../../utils/util';
import { Toast } from '@cola/Toast';
import mobileLog from '../../utils/mobileLog';

// const eventBus = getGlobalEvent();

// 返回箭头图标组件
const BackIcon = ({ color = '#000000', className }) => (
  <svg className={className} width="100%" height="100%" viewBox="0 0 18 31" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_104_11561" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="-1" y="-3" width="38" height="37">
      <path d="M36.0232 -2.43852V33.4385H0.146176V-2.43852H36.0232Z" fill="white" stroke="white"/>
    </mask>
    <g mask="url(#mask0_104_11561)">
      <path d="M15.5268 28.8258L2.17648 15.5L15.5268 2.17424" stroke={color} strokeWidth="3" strokeLinecap="square"/>
    </g>
  </svg>
);

// 分享图标组件
const ShareIcon = ({ color = '#FFFFFF', className }) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_104_1726" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
      <path d="M35.5 0.5V35.5H0.5V0.5H35.5Z" fill="white" stroke="white"/>
    </mask>
    <g mask="url(#mask0_104_1726)">
      <path d="M32.4231 15.9804V26.6535C32.4231 29.8397 29.8401 32.4227 26.6538 32.4227H8.76923C5.58297 32.4227 3 29.8397 3 26.6535V8.76886C3 5.58261 5.58297 2.99963 8.76923 2.99963H19.4423" stroke={color} strokeWidth="3"/>
      <path d="M23.7695 2.99963H32.4234V11.6535" stroke={color} strokeWidth="3"/>
      <path d="M31.9908 3.43323L17.2793 19.0101" stroke={color} strokeWidth="3"/>
    </g>
  </svg>
);

// const MusicIcon = ({ color = '#FFFFFF', className }) => (
//   <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <mask id="mask0_104_1726"  maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
//       <path d="M35.5 0.5V35.5H0.5V0.5H35.5Z" fill="white" stroke="white"/>
//     </mask>
//     <g>
//       <path d="M20.064 35.7387C28.697 35.7387 35.6955 28.7402 35.6955 20.1072C35.6955 11.4741 28.697 4.47559 20.064 4.47559C11.4309 4.47559 4.43237 11.4741 4.43237 20.1072C4.43237 28.7402 11.4309 35.7387 20.064 35.7387Z" stroke={color} stroke-width="3" stroke-linecap="square"/>
//       <path d="M19.4176 28.236C21.486 28.236 23.1628 26.5592 23.1628 24.4908C23.1628 22.4224 21.486 20.7456 19.4176 20.7456C17.3491 20.7456 15.6724 22.4224 15.6724 24.4908C15.6724 26.5592 17.3491 28.236 19.4176 28.236Z" stroke={color} stroke-width="3" stroke-linecap="square" stroke-linejoin="round"/>
//       <path d="M22.578 22.3674L18.8824 13.254L23.1626 11.1139" stroke={color} stroke-width="3" stroke-linecap="square"/>
//     </g>
// </svg>
// );

// 滚动配置
const scrollConfig = {
  distance: 200, // 滚动多少距离后背景完全显示
  hideBarWhenNotScroll: 1 // 是否在未滚动时隐藏背景
};

// 背景颜色配置
const barConfig = {
  color: '#20A0F3' // 滚动后的背景颜色
};

// 颜色转换为rgba格式
const colorToRgb = (color, opacity) => {
  let r, g, b;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else {
    return color;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default class TitleBar extends Component {

  static defaultProps = {
    initialStatusBarMode: 0, // 初始状态栏模式：0=浅色（默认），1=黑色
    // scrollStatusBarMode: 1,  // 滚动后状态栏模式：1=黑色（默认），0=浅色
    forceDarkStatusBar: false, // 强制全程黑色（优先级最高，覆盖上面两个配置）
    showPlaceHolder: false,
    showShare: false,
    iconColor: '#FFFFFF', // 默认图标颜色（原有逻辑补充默认值）
    bgMusic: '' //父组件传的音频链接
  };

  shareConfigData = null;

  state = {
    statusBarHeight: 0,
    titleBarHeight: 0,
    barBgColor: 'transparent',
    hasBg: false, // 是否显示背景
    sharePicStatus: 'loading',
    isPlaying: false //播放状态
  }

  componentDidMount () {
    const initialStatusBarMode = this.props.forceDarkStatusBar 
      ? 1 
      : this.props.initialStatusBarMode;

    LightMobileCall.mobileCall(232, {
      isFullScreen: 1,
      isHideTitleBar: 1,
      isShowArrow: 0,
      statusBarMode: initialStatusBarMode,
    });

    LightMobileCall.mobileCall(231, null, (res) => {
      if (res.status === 1) {
        let statusBarHeight = res.dpStatusBarHeight;
        let titleBarHeight = res.dpTitleBarHeight;
        if (LightMobileCall.isIOS) {
          statusBarHeight = res.dpStatusBarHeight;
          titleBarHeight = res.dpTitleBarHeight - res.dpStatusBarHeight;
        }
        this.setState({
          statusBarHeight,
          titleBarHeight
        })
      }
    })

    this.addEventListener();

    this.shareCleanup = handleSharePic({
      useSharePic: this.props.useSharePic || '', 
      defaultShareConfig: this.props.shareConfig || {},
      onStatusChange: (status, finalConfig) => {
        this.setState({ sharePicStatus: status });
        if (finalConfig) {
          this.shareConfigData = finalConfig;
        }
      }
    });
    this.initAudio(); //初始化音频
  }

  componentWillUnmount () {
    this.removeEventListener();
    void this.shareCleanup?.();
    if (this.audio) {
      this.audio.pause(); //卸载组件
    }
  }

  //音乐初始化
  initAudio = () => {
    const { bgMusic } = this.props;
    if (!bgMusic) return;

    this.audio = document.createElement('audio');
    this.audio.loop = true;
    this.audio.src = bgMusic;

    this.audio.onplay = () => {
      this.setState({isPlaying: true})
    };
    this.audio.onpause = () => {
      this.setState({isPlaying: false})
    };
    this.playMusic();
  }; 

  //暂停音乐
  pauseMusic = () => {
    if (this.audio) {
    this.audio.pause();
    }
  }
  
  //播放音乐
  playMusic = () => {
    const {bgMusic} = this.props;
    if (!bgMusic || !this.audio) return;

    LightMobileCall.mobileCall(125, { type: 3 });
    
    try {
      this.audio.play();
    } catch(err){
      console.error('音频播放失败：', err);
      Toast.info({ content: '音频播放失败，请稍后重试' });
    }
    
  }

  //音乐点击事件
  handleMusicEvt = () => {
    const { isPlaying } = this.state;

    // 切换播放/暂停状态
    if (isPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

 scrollEvent = (scrollTop) => {
    if (scrollConfig.hideBarWhenNotScroll) {
      const hasBg = scrollTop > 0;
      // 滚动后目标模式：forceDarkStatusBar为true则强制1，否则用scrollStatusBarMode
      // const targetStatusBarMode = this.props.forceDarkStatusBar 
      //   ? 1 
      //   : this.props.scrollStatusBarMode;
      // 未滚动到阈值时模式：forceDarkStatusBar为true则强制1，否则用initialStatusBarMode
      const defaultStatusBarMode = this.props.forceDarkStatusBar 
        ? 1 
        : this.props.initialStatusBarMode;

      if (scrollTop >= scrollConfig.distance) {
        // 滚动到阈值：背景色+目标状态栏模式
        this.setState({ 
          barBgColor: this.props.barConfig?.color || barConfig.color, 
          hasBg 
        });
        LightMobileCall.mobileCall(232, {
          isFullScreen: 1,
          isHideTitleBar: 1,
          isShowArrow: 0,
          statusBarMode: 1 
        });
      } else {
        const opacity = scrollTop / scrollConfig.distance;
        this.setState({ 
          barBgColor: colorToRgb(this.props.barConfig?.color || barConfig.color, opacity), 
          hasBg 
        });
        LightMobileCall.mobileCall(232, {
          isFullScreen: 1,
          isHideTitleBar: 1,
          isShowArrow: 0,
          statusBarMode: defaultStatusBarMode // 未滚动模式
        });
      }
    }
  }

  handleBodyScroll = () => {
    const scrollTop = document.body.scrollTop;
    this.scrollEvent(scrollTop);
  }

  handleWindowScroll = () => {
    const scrollTop = document.documentElement.scrollTop;
    this.scrollEvent(scrollTop);
  }

  handlePageScroll = () => {
    const page = document.getElementById('page');
    if (page) {
      this.scrollEvent(page.scrollTop);
    }
  }

  addEventListener = () => {
    if (scrollConfig.hideBarWhenNotScroll) {
      document.body.addEventListener('scroll', this.handleBodyScroll);
      window.addEventListener('scroll', this.handleWindowScroll);
      const page = document.getElementById('page');
      if (page) {
        page.addEventListener('scroll', this.handlePageScroll);
      }
    }
  }

  removeEventListener = () => {
    document.body.removeEventListener('scroll', this.handleBodyScroll);
    window.removeEventListener('scroll', this.handleWindowScroll);
    const page = document.getElementById('page');
    if (page) {
      page.removeEventListener('scroll', this.handlePageScroll);
    }
  }

  backEvt = () => {
    if (LightMobileCall.isIOS) {
      LightMobileCall.mobileCall(158, { type: 6 });
    } else {
      LightMobileCall.mobileCall(247, { count: 1, paramInfo: { type: 1 } });
    }
  }

  shareEvt = () => {
    // 调用分享功能
    const { sharePicStatus } = this.state;
    // const { shareConfig = [] } = this.props;
    if (sharePicStatus === 'loading') {
      Toast.info({ content: '分享图加载中，请稍候' });
      return;
    }
    mobileLog({
      a: 1134954,
      b: '点击',
      ft: '贵族摇奖机页面',
      r: '养狗',
      svar1: '2' ,
    });
    // share.resetShareData(shareConfig);

    window.isClickShareBtn = 1;
    const config = this.shareConfigData;
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
  }

  render () {
    const { statusBarHeight, titleBarHeight, barBgColor, hasBg } = this.state;
    const showPlaceHolder = this.props.showPlaceHolder || false;
    // const showShare = this.props.showShare !== false; // 默认显示分享按钮
    const showShare = this.props.showShare || false; // 默认显示分享按钮
    // 背景显示时图标为黑色，否则使用传入的颜色
    const currentIconColor = hasBg ? '#000000' : this.props.iconColor;
    return (
      <React.Fragment>
        {showPlaceHolder ? (
          <div className={styles.placeHolder} style={{height: statusBarHeight + titleBarHeight + 'px'}}></div>
        ) : null}
        <div 
          className={`${styles.wrap} ${this.props.className}`}
          style={{
            height: statusBarHeight + titleBarHeight + 'px',
            backgroundColor: barBgColor,
            transition: 'background-color 0.3s ease'
          }}
        >
          <div className={styles.statusBar} style={{height: statusBarHeight + 'px'}}></div>
          <div className={styles.titleBar} style={{height: titleBarHeight + 'px'}}>
            <div className={styles.arrowWrap} onClick={this.backEvt} aria-label="返回" role="button">
              <BackIcon className={styles.arrow} color={currentIconColor} />
            </div>
            {this.props.title ? (
              <div className={styles.title} style={{lineHeight: titleBarHeight + 'px'}}>{this.props.title}</div>
            ) : null}
            {showShare && (
              // span className={styles.}
              <div className={styles.rightBtns}>
                {/* <div className={styles.musicWrap} onClick={this.handleMusicEvt} aria-label="音乐按键" role="button">
                  <MusicIcon 
                  className={`${styles.music} ${styles.musicRotating} ${isPlaying ? '' : styles.musicPaused}`} 
                  color={currentIconColor}
                  />
                </div> */}
                <div className={styles.shareWrap} onClick={this.shareEvt} aria-label="分享" role="button">
                  <ShareIcon className={styles.share} color={currentIconColor} />
                </div>
              </div>
            )}
          </div>
        </div>
      </React.Fragment>
    )
  }
}