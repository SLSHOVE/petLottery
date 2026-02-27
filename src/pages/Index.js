import React, {Component} from 'react';
import '../assets/common.css';
import styles from './Index.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import AutoPushBi from '../utils/autoPushBi';
import openKugouApp from "@kugou/open-kugou-app";


const data = combineSubmodule('Index');

class Index extends Component {

  componentDidMount () {

    // 需要业务传入的值
    // 注意, 如果涉及到拉端，这个一定不能删： 用来统计拉端成功率的
    // 纯端内的页面可以不用
    window._kg_opendata_ = {
        page: "活动页", // 页面类型， 可选值： 活动页|MV|单曲｜歌单｜排行版｜歌手｜专辑｜换量 等。缺省默认是 活动页
        activityName: "" || document.title, // 活动名， 缺省默认是 document.title
        activityId: "" || window._VO_ACT_ID_, // 活动id， 缺省默认是空, 传voo生成的那åå个活动id
        codeSystem: "voo", // 代码后台， voo、魔方、繁华、等， 缺省默认是空
        channel: "", // 投放渠道， 字符串类型  缺省默认是空
    }
    if (window._kg_openkugouapp_pageExposeReported_fun_) {
      // 这个暴露是 @kugou/open-kugou-app 组件暴露的
      // 对应的h5埋点是： a: 1133566
      window._kg_openkugouapp_pageExposeReported_fun_();
    }

    window.vs_finish && window.vs_finish();
  }

  render () {
    return (
      <div>

      </div>
    );
  }
}

Index.defaultProps = data;

export default Index;
