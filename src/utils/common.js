import kgLoad from '@kugou/kg-loading';

const toastQueue = []
export const Toast = (word, delay, noAutoHide = false) => {
    // 防重复
    const preToast = document.getElementById('toastCover')
    if (preToast) {
        toastQueue.push({ word, delay, noAutoHide })
        return
    }

    let toastCover = document.createElement('div'),
        toastText = document.createElement('div')
    delay = delay || 1500;
    toastCover.style.cssText = 'position:fixed;top:40%;width:100%;left:0;bottom:0;right:0;z-index:100000;text-align:center;';
    toastCover.id = 'toastCover';
    toastText.style.cssText = 'background:rgba(0,0,0,.85);border-radius:22px;color:#fff;max-width:60%;line-height: 1.5;letter-spacing:1px;padding:9px 20px;margin:auto;font-size: 15px;margin: auto;display:inline-flex;justify-content:center;align-items:center;';
    toastText.id = 'toastText';
    toastText.innerText = word;
    toastCover.appendChild(toastText);
    document.body.appendChild(toastCover);

    if (noAutoHide) return

    const timer = setTimeout(function () {
        clearTimeout(timer)
        if (document.querySelector('#toastCover')) {
            toastCover.parentNode.removeChild(toastCover);
        }

        // 显示队列里的其他toast
        showNextToast()
    }, delay)
}
function showNextToast() {
    if (toastQueue.length) {
        const newToast = toastQueue.shift()
        Toast(newToast.word, newToast.delay, newToast.noAutoHide)
    }
}

export const showQrcodeToast = () => {
    if (window.IS_PC) {
        Toast('扫描右侧二维码获取更佳体验')
        return true
    } else {
        return false
    }
}

export const loading = (() => {
    let _loading = null;
    return {
        show(text) {
            this.hide()
            _loading = kgLoad({
                msg: text || "请稍候....",
                type: "toast",
                delay: 400,
                autoWarn: true,
                popMode: true,
                popConfig: {
                    showBg: true,
                    containerBgColor: "default",
                    maskBgColor: "none",
                },
            });
        },
        hide() {
            _loading && _loading.remove();
            _loading = null
        }
    }
})();

// 奖励资源
export const prizeMap = {
  '1001': {
    src: require('../assets/image/prizes/1000.png'),
    row: 1,
    col: 1,
  },
  '1002': {
    src: require('../assets/image/prizes/1000.png'),
    row: 1,
    col: 1,
  },
  '1003': {
    src: require('../assets/image/prizes/1000.png'),
    row: 1,
    col: 1,
  },
  '1004': {
    src: require('../assets/image/prizes/1000.png'),
    row: 1,
    col: 1,
  },
  '1005': {
    src: require('../assets/image/prizes/1000.png'),
    row: 1,
    col: 1,
  },
  '2001': {
    src: require('../assets/image/prizes/2001.png'),
    row: 1,
    col: 2,
  },
  '2002': {
    src: require('../assets/image/prizes/2002.png'),
    row: 1,
    col: 2,
  },
  '2003': {
    src: require('../assets/image/prizes/2003.png'),
    row: 1,
    col: 2,
  },
  '3001': {
    src: require('../assets/image/prizes/3001.png'),
    row: 2,
    col: 1,
  },
  '3002': {
    src: require('../assets/image/prizes/3002.png'),
    row: 2,
    col: 1,
  },
  '4001': {
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '4002': {
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '4003': {
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '4004':{
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '4005': {
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '4006': {
    src: require('../assets/image/prizes/4000.png'),
    row: 1,
    col: 1,
  },
  '5001': {
    src: require('../assets/image/prizes/5001.png'),
    row: 3,
    col: 3,
  },
  '5002': {
    src: require('../assets/image/prizes/5002.png'),
    row: 3,
    col: 3,
  },
  '5003': {
    src: require('../assets/image/prizes/5003.png'),
    row: 3,
    col: 3,
  },
}

// 卡片资源
export const cardMap = {
  '2001': require('../assets/image/cards/2001.png'),
  '2002': require('../assets/image/cards/2002.png'),
  '2003': require('../assets/image/cards/2003.png'),
  '3001': require('../assets/image/cards/3001.png'),
  '3002': require('../assets/image/cards/3002.png'),
}
