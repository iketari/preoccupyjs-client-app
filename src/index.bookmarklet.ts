import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import App from './App';

const root = document.createElement('div');
document.body.append(root);

const app = new App({
  el:  root as HTMLElement,
  appMode: true
});

app.init();
