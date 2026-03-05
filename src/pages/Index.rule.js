import React, {Component} from 'react';
import '../assets/common.css';
import styles from './Rule.module.css';
import combineSubmodule from '../utils/combineSubmodule';
import Titlebar from '../components/titlebar';
import LightMobileCall from '@kugou/light-mobilecall';
import mobileLog from '../utils/mobileLog';
import ruleImg from '../assets/image/rule/ruleImg.png'
const data = combineSubmodule('Index');

class Rule extends Component {

  componentDidMount() {
    window.vs_finish && window.vs_finish();
    mobileLog({
              a: 1134953,
              b: '曝光',
              ft: '贵族摇奖机各页面',
              r: '养狗',
              svar1: '2'
            });
  }

  render() {
    // const rule = this.props.digRule;
    // const date = this.props.date

    return (
      <div className={styles.wrap}>
        {LightMobileCall.isInClient() ? <Titlebar title="活动规则" showPlaceHolder={true} iconColor="#000000"/> : null}
        
        {/* <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>活动时间</h3>
            <div className={styles.sectionContent}>
              {this.props.date}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>挖宝机会获取</h3>
            <div className={styles.sectionContent}>
              {rule.map((ruleItem, index) => (
                <p key={index}>{ruleItem.rule}</p>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>奖励领取须知</h3>
            <div className={styles.sectionContent}>
              {this.props.rewardClaimInformation}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>活动奖励</h3>
            <div className={styles.sectionContent}>
            {this.props.reward}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>其他说明</h3>
            <div className={styles.sectionContent}>
              {this.props.otherNotes}
            </div>
          </div>
        </div> */}
        <div className={styles.ruleBox}>
          <img
          className={styles.ruleImg}
          src={ruleImg}
          alt=''
        />
        </div>
        
      </div>
    )
  }
}

Rule.defaultProps = data;

export default Rule;
