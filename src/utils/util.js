import kGRequest from '@kugou/request';
import LightMobileCall from '@kugou/light-mobilecall';
import openKugouApp from "@kugou/open-kugou-app";
import PictureGenerator from '@kugou/npm-picture-generator';
import share from '@kugou/share';
import { Toast } from '@cola/Toast';



export function baseInfo() {
    return new Promise((resolve) => {
        kGRequest.getBaseInfo(LightMobileCall.isInClient() ? null : 1058, function (baseInfo) {
            resolve(baseInfo);
        });
    });
};

export async function checkLogin() {
    const baseinfo = await baseInfo();
    if (!baseinfo.userid) {
        LightMobileCall.mobileCall(102, { topicName: "酷狗X贵族摇宠粮活动", loginType: null });
        return false
    }
    return true
}

export const closePage = () => {
    if (LightMobileCall.isIOS) {
        LightMobileCall.mobileCall(158, { type: 6 });
    } else {
        LightMobileCall.mobileCall(247, { count: 1, paramInfo: { type: 1 } });
    }
}

export const isInClient = window.__debug ? true : LightMobileCall.isInClient() ? true : false;

export const callAppLogin = () => {
    if (isInClient) {
        LightMobileCall.mobileCall(102, {
            topicName: "",
            loginType: "",
        })
        return;
    }
    openKugouApp("303", 9, 0, {
        url: window.location.href,
        title: "酷狗X贵族摇宠粮活动",
    });
}

export function getUrlParams(key, url, splitKey) {
    var value = "";
    var searchStr = '';
    if (url) {
        splitKey = splitKey || '?'
        if (url.indexOf(splitKey) === -1) return ''
        searchStr = url.split(splitKey)[1]
    } else {
        searchStr = window.location.search.replace('?', "");
    }
    if (!searchStr) return ''

    var searchArr = searchStr.split("&");
    for (var i = 0; i < searchArr.length; i++) {
        if (searchArr[i].split("=")[0] === key) {
            value = searchArr[i].split("=")[1];
            break;
        }
    }
    return value;
}

// 根据pageName拼接跳转url
export const buildJupmUrl = ({ pageName, params = {} }) => {
    // 获取当前页面链接，替换为pageName, 然后拼接params
    const currentUrl = window.location.href;
    let newUrl = currentUrl.replace(/\/[^/]+$/, `/${pageName}.html`);
    const channel = getUrlParams('channel');
    const hreffrom = getUrlParams('hreffrom');
    if (channel) {
        params.channel = channel;
    }
    if (hreffrom) {
        params.hreffrom = hreffrom;
    }
    // 兼容性处理：Object.entries 兼容低版本浏览器
    function getObjectEntries(obj) {
        if (Object.entries) {
            return Object.entries(obj);
        } else {
            var ownProps = Object.keys(obj);
            var resArray = new Array(ownProps.length);
            for (var i = 0; i < ownProps.length; i++) {
                resArray[i] = [ownProps[i], obj[ownProps[i]]];
            }
            return resArray;
        }
    }
    const paramEntries = getObjectEntries(params);
    if (paramEntries.length > 0) {
        const queryString = paramEntries
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        newUrl += `?${queryString}`;
        return newUrl;
    }
    return newUrl;
}

export const jumpPage = (ios_url, android_url) => {
    var url = '';
    if (LightMobileCall.isIOS) {
        url = ios_url
    } else {
        url = android_url
    }
    if (LightMobileCall.isInClient()) {
        LightMobileCall.mobileCall(123, {
            browser: 0,
            url: url
        })
    } else {
        window.location.href = url;
    }
}

export const handleSharePic = ({
  useSharePic = '',
  defaultShareConfig = {},
  onStatusChange,
}) => {
  let picGenerator = null;

  void onStatusChange?.('loading');

  if (!useSharePic) {
    let finalConfig = { ...defaultShareConfig };
    finalConfig.url = window.location.href;
    share.resetShareData(finalConfig);
    console.log("【share.resetShareData】传入的配置：", finalConfig,);
    console.log("【share.defaultShareConfig】传入的配置：", defaultShareConfig);
    void onStatusChange?.('success', finalConfig);
    return () => {};
  }

  try {
    const drawConfig = {
      width: 764,
      height: 1512,
      dataSource: [
        {
          type: 'image',
          name: 'sharePic',
          content: useSharePic,
          x: 0,
          y: 0,
          width: 764,
          height: 1512,
          zIndex: 1,
        },
      ],
      imgDataType: 'png',
      backgroundColor: '#fff',
    };

    picGenerator = new PictureGenerator(null, drawConfig);

    picGenerator.draw(
      {},
      (imgBase64) => {
        const completeBase64 = imgBase64.startsWith('data:image')
          ? imgBase64
          : `data:image/png;base64,${imgBase64}`;
        
        const finalConfig = {
          type: 4,
          img: completeBase64,
        //   ...defaultShareConfig,
        url: defaultShareConfig.url,
        title: defaultShareConfig.title,
        content: defaultShareConfig.content,
        copyContent: defaultShareConfig.copyContent,
        showXhs: defaultShareConfig.showXhs !== undefined ? defaultShareConfig.showXhs : 1,
        xhsTitle: defaultShareConfig.xhsTitle || '来酷狗领狗粮',
        xhsContent: defaultShareConfig.xhsContent || '酷狗X贵族发狗粮啦！大把宠物福利等你来抽~',
        xhsPicUrl: defaultShareConfig.xhsPicUrl || '',
        };

        share.resetShareData(finalConfig);
        void onStatusChange?.('success', finalConfig, completeBase64);
      },
      (err) => {
        // console.error('分享图重绘失败：', err);
        void onStatusChange?.('error', defaultShareConfig);
      }
    );
  } catch (err) {
    // console.error('分享图处理初始化失败：', err);
    void onStatusChange?.('error', defaultShareConfig);
  }

  return () => {
    if (picGenerator?.destroy) {
      picGenerator.destroy();
    }
  };
};

export const openNewPage = (targetTab)=>{
    if (LightMobileCall.isIOS) {
      LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
        if (!res || res.status === 0) {
          Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
        }
        // this.setState({ isLoading: false });
      });
    } else {
       LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
        if (!res || res.status === 0) {
          Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
        }
      });
    }
   }

   export const openLittleNest = (targetTab)=>{
    if (LightMobileCall.isIOS) {
      LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
        if (!res || res.status === 0) {
          Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
        }
        this.setState({ isLoading: false });
      });

      setTimeout(() => {
        LightMobileCall.mobileCall(158, { type: 3 })
      }, 300)
      
    } else {
       LightMobileCall.mobileCall(158, { type: 2 });
       LightMobileCall.mobileCall(1600, { target_tab: targetTab }, (res) => {
        if (!res || res.status === 0) {
          Toast.info({ content: res?.errmsg || "操作失败，请稍后重试" });
        }
      });
    }
   }