const propTypes = require('@kugou/voo-prop-types');
module.exports = {
    title: {
        name: "标题",
        type: propTypes.string
    },
    userinfo: {
        name: "用户信息",
        type: propTypes.object,
        dataSourceId: '7281b811-f318-11ea-b64c-95e9dc56fbc7',
        children: {
            userId: {
                name: '用户id',
                type: propTypes.number,
                isTriggerKey: true
            },
            username: {
                name: "用户名",
                type: propTypes.string,
                rejectAs: '$data$.data.userName' 
            },
            age: {
                name: "年龄",
                type: propTypes.number,
                rejectAs: '$data$.data.age'
            },
            avatar: {
                name: "《阿凡达》",
                type: propTypes.img
            },
            sex: {
                name: "性",
                type: propTypes.string
            }
        }
    },
    list: {
        name: "列表",
        type: propTypes.array,
        children: {
            type: propTypes.object,
            children: {
                id: {
                    name: "id",
                    type: propTypes.number
                },
                name: {
                    name: "的名字",
                    type: propTypes.string
                }
            }
        }
    }
}