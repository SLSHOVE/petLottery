import 'core-js/features/set';
import 'core-js/features/map';
// import 'core-js/features/promise';
import 'core-js/features/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import App from '../pages/Index.prize';
import '../assets/common.css'
// import * as serviceWorker from './serviceWorker';
import DataContext from '../utils/dataContext';
import withData from '../utils/withData';

const rejectData = window._REJECT_DATA_ || {}
const DataApp = withData(App)

function render (data={}) {
  if (data.func && data.func.indexOf('G_ADF') >= 0) return // 防止鹅厂浏览器的注入代码的执行导致我们被动 re-render
  const element =
    <DataContext.Provider value={data}>
      <DataApp>
      </DataApp>
    </DataContext.Provider>

  ReactDOM.render(element, document.getElementById('root'));
}

render(rejectData)

if (window._VO_ENV_ === 'dev') {
  window._RENDER_ = render
}
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
