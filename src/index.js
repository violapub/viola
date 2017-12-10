import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
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

ReactDOM.render(<App data={data} />, document.getElementById('root'));
registerServiceWorker();
