import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import App from './App';

const app = new App({
  el:  document.getElementById('root') as HTMLElement,
  appMode: false
});

app.init();
