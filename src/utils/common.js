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