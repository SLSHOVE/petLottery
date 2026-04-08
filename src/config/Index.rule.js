const propTypes = require('@kugou/voo-prop-types');
module.exports = {
    sharePosterConfig: {
        name: '分享卡片配置',
        type: propTypes.object,
        children: {
            title: {
                name: '分享卡片标题',
                type: propTypes.string
            },
            content: {
                name: '分享卡片副标题',
                type: propTypes.string
            },
            url: {
                name: '链接降级',
                type: propTypes.string
            },
            img: {
                name: '分享卡片封面',
                type: propTypes.img
            },
            poster: {
                name: '分享卡片完整海报',
                type: propTypes.img
            },
            withoutQrPoster: {
                name: '无二维码版分享海报',
                type: propTypes.string 
            },
            xhs_config: [{
                name: '小红书平台分享配置',
                type: propTypes.array 
            }]
        }
    },

    iOS_TARGET_VERSION: {
        name: 'iOS版本号',
        type: propTypes.string
    },
    Android_TARGET_VERSION: {
        name: 'Android版本号',
        type: propTypes.string
    },

    prizeCopywriting: {
        name: '奖品文案配置',
        type: propTypes.object,
        children: {
            textDefault: {
                name: '默认配置文案',
                type: propTypes.string
            },
            text1: { name: '1号奖品文案', type: propTypes.string },
            text2: { name: '2号奖品文案', type: propTypes.string },
            text3: { name: '3号奖品文案', type: propTypes.string },
            text4: { name: '4号奖品文案', type: propTypes.string },
            text5: { name: '5号奖品文案', type: propTypes.string },
        }
    },   
    useSharePic: {
        name: '端外分享降级图片',
        type: propTypes.img
    },
    iOS_VipUrl: {
        name: 'iOS Vip链接',
        type: propTypes.string
    },
    iOS_SvipUrl: {
        name: 'iOS Svip链接',
        type: propTypes.string
    },
    Android_VipUrl: {
        name: 'Android Vip链接',
        type: propTypes.string
    },
    Android_SvipUrl: {
        name: 'Android Svip链接',
        type: propTypes.string
    },
    petTaskUrl: {
        name: '宠物任务跳转链接',
        type: propTypes.string
    },
    vipIcon: {
        name: 'vip按键图标',
        type: propTypes.img
    },
    MILK_TEA_URL: {
        name:  '奶茶券跳转链接',
        type: propTypes.string
    },
    TAKEAWAY_URL: {
        name: '外卖券跳转链接',
        type: propTypes.string
    },
    date: {
        name: '活动时间',
        type: propTypes.string
    },
    digRule: {
        name: '游戏规则讲解',
        type: propTypes.array,
        children: {
            type: propTypes.object,
            children: {
                rule: {
                    name: '规则',
                    type: propTypes.string
                }
            }
        }
    },
    rewardClaimInformation: {
        name: '奖励领取须知',
        type: propTypes.string
    },
    reward: {
        name: '活动奖励',
        type: propTypes.string
    },
    otherNotes: {
        name: '其他说明',
        type: propTypes.string
    }
}