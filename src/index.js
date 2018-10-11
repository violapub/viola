import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import route from './misc/router';
import registerServiceWorker from './registerServiceWorker';
import withIntl from './withIntl';
import './index.css';

const dataDOM = document.getElementById('viola-data');
let data = {};
if (dataDOM && dataDOM.dataset['json']) {
  try {
    data = JSON.parse(decodeURIComponent(dataDOM.dataset['json']));
  } catch (e) {
    // do nothing
  }
}
const routeAction = route();
const IntlApp = withIntl(App);

ReactDOM.render(
  <IntlApp data={{ ...data, routeAction }} />,
  document.getElementById('root')
);
registerServiceWorker();
