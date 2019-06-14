import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import App from './App';

const root = document.createElement('div');
document.body.append(root);
ReactDOM.render(React.createElement(App, { appMode: true }, null), root);
