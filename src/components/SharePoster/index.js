import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { getGlobalEvent } from '../../utils/eventEmitter';
import { Toast } from '../../utils/common';
import styles from './index.module.css';
import LightMobileCall from '@kugou/light-mobilecall';
import { buildJupmUrl } from '../../utils/util';

// 默认分享配置
const DEFAULT_SHARE_CONFIG = [
  {
    platform: 2,
    name: '微信',
    img: 'https://voowebpbssdl.kugou.com/2f9ece67-e4a1-429a-9583-154070ddaadd_1440.png'
  },
  {
    platform: 1,
    name: '朋友圈',
    img: 'https://voowebpbssdl.kugou.com/3c0669be-965f-4c19-8826-9073b61b3d56_1440.png'
  },
  {
    platform: 7,
    name: '小红书',
    img: 'https://voowebpbssdl.kugou.com/267f0b23-03d7-4dfc-b627-fda63d8784f4_1440.png'
  },
  {
    platform: 3,
    name: 'QQ',
    img: 'https://voowebpbssdl.kugou.com/6f52db3b-6176-47d2-8031-26fc4c4cf055_1440.png'
  },
  {
    platform: 5,
    name: 'QQ空间',
    img: 'https://voowebpbssdl.kugou.com/8aa05e1c-1619-4e8c-acb3-adbbb5da8447_1440.png'
  },
  {
    platform: 4,
    name: '微博',
    img: 'https://voowebpbssdl.kugou.com/fmt01_58351722807b01a4d3c105d417f2f527.png'
  },
];

// 保存图片回调
window.__saveImageCallback = (data) => {
  if (LightMobileCall.isIOS) {
    if (data.status === 0) {
      Toast('图片保存失败，请到设置隐私中打开权限');
    }
  } else {
    if (data.status === 0) {
      Toast('图片保存失败，请到设置中打开权限');
    } else if (data.status === 1) {
      Toast('已保存至本地');
    }
  }
};

// 保存图片到客户端
export function saveImgToClientCmd(params) {
  return new Promise((resolve, reject) => {
    try {
      LightMobileCall.mobileCall(750, {
        ...params,
        callback: '__saveImageCallback'
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

const eventHub = getGlobalEvent();

// 加载图片
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// 生成Canvas海报 - 直接绘制传入的卡片图片 + 二维码
const generatePosterCanvas = async (canvasElement, posterData, withQrcode = true) => {
  if (!canvasElement) return null;

  const { cardImage, url } = posterData;
  const dpr = 2;
  // 图片尺寸 600x1000 (根据设计稿)
  const width = 600;
  const height = 1000;

  canvasElement.width = width * dpr;
  canvasElement.height = height * dpr;
  const ctx = canvasElement.getContext('2d');
  // ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  ctx.scale(dpr, dpr);

  try {
    // 直接绘制传入的卡片图片
    if (cardImage) {
      const cardImg = await loadImage(cardImage);
      ctx.drawImage(cardImg, 0, 0, width, height);
    }

    // 绘制二维码
    if (withQrcode) {
      const qrCodeDataURL = await QRCode.toDataURL(url || buildJupmUrl({pageName: 'index'}), {
        width: 136,
        height: 136,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
      
      const qrImg = await loadImage(qrCodeDataURL);
      const qrSize = 68;
      // 二维码位置：右下角 (参考 Figma 设计稿位置)
      const qrX = 507;
      const qrY = 912;
      
      // 绘制二维码
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

  } catch (error) {
    console.error('生成海报失败:', error);
  }
};

const SharePoster = ({ shareConfig }) => {
  const [visible, setVisible] = useState(false);
//   const [shareData, setShareData] = useState({});
  const canvasRef = useRef(null);
  const canvasWithoutQrcodeRef = useRef(null);
  const shareChannelConfig = DEFAULT_SHARE_CONFIG;

  useEffect(() => {
    const handleShare = (theShareData) => {
    //   setShareData(theShareData);
      setVisible(true);

      setTimeout(() => {
        if (canvasRef.current) {
          generatePosterCanvas(canvasRef.current, {
            cardImage: theShareData.cardImage,
            // url: theShareData.url
          }, true);
          
          generatePosterCanvas(canvasWithoutQrcodeRef.current, {
            cardImage: theShareData.cardImage,
            // url: theShareData.url
          }, false);
        }
      }, 0);
    };

    eventHub.on('share', handleShare);

    return () => {
      eventHub.off('share', handleShare);
    };
  }, []);

  const handleSave = async () => {
    if (!canvasRef.current) return;
    try {
      const imgData = canvasRef.current.toDataURL('image/png');
      await saveImgToClientCmd({ imageData: imgData });
    } catch (error) {
      console.error('保存图片失败:', error);
    }
  };

  const isXhsShare = (type) => Number(type) === 7;

  const clickToShare = async (platform, name, e) => {
    e.stopPropagation();
    
    if (platform === 'save') {
      return handleSave();
    }

    if (isXhsShare(platform)) {
      const xhs_config = shareConfig?.xhs_config || [];
      const xhsIdx = Math.floor(Math.random() * xhs_config.length);
      const xhsTitle = xhs_config[xhsIdx]?.title || '来酷狗养福气萌宠';
      const xhsContent = xhs_config[xhsIdx]?.content || '来酷狗，扫码养福气萌宠吧~';
      
      LightMobileCall.mobileCall(115, {
        type: 4,
        platform_type: platform,
        shareData: {
          imageData: canvasWithoutQrcodeRef.current?.toDataURL('image/png'),
          title: xhsTitle,
          content: xhsContent
        }
      });
    } else {
      const title = shareConfig?.title || '来酷狗养福气萌宠';
      const content = shareConfig?.content || '来酷狗，扫码养福气萌宠吧~';
      
      LightMobileCall.mobileCall(115, {
        type: 4,
        platform_type: platform,
        shareData: {
          imageData: canvasRef.current?.toDataURL('image/png'),
          title: title,
          content: content
        }
      });
    }
    
    eventHub.emit('shareSuccess');
  };

  const onMaskClick = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.container} onClick={onMaskClick}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <div className={styles.closeBtn} onClick={onMaskClick}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            {/* <circle cx="15" cy="15" r="14" stroke="#FFFFFF" strokeWidth="2"/>
            <path d="M10 10L20 20M20 10L10 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/> */}
            <path d="M6 6L24 24M24 6L6 24" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Canvas展示区域 */}
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} className={styles.canvas} />
          <canvas ref={canvasWithoutQrcodeRef} className={styles.canvasHidden} />
        </div>

        {/* 分享底部区域 */}
        <div className={styles.shareBottom}>
          <div className={styles.shareList}>
            {/* 保存图片 */}
            <div
              className={styles.shareItem}
              onClick={(e) => clickToShare('save', '保存', e)}
            >
              <div className={styles.shareIcon}>
                <img src="https://voowebpbssdl.kugou.com/c485bb15-90ec-4181-9735-a88295886df2_1440.png" alt="保存" />
              </div>
              <span>保存</span>
            </div>

            {/* 分享到各平台 */}
            {shareChannelConfig.map((config, index) => (
              <div
                key={index}
                className={styles.shareItem}
                onClick={(e) => clickToShare(config.platform, config.name, e)}
              >
                <div className={styles.shareIcon}>
                  <img src={config.img} alt={config.name} />
                </div>
                <span>{config.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePoster;
