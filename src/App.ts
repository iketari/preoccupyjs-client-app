import { Host, createClient } from 'preoccupyjs';
import WebSocketService, { IMessage } from './modules/websocket.service';
import WebRTCService from './modules/webrtc.service';
import CustomTransport from './modules/preoccupy.transport';

/* eslint import/no-webpack-loader-syntax: off */
//@ts-ignore
import bookmarklet from './assets/bookmarklet.bundle';

interface IAppState {
  name: string | null;
  messages: IMessage[];
  appMode: boolean;
  showLog: boolean;
}

export interface IAppProps {
  appMode: boolean;
}

export interface IVanillaAppProps extends IAppProps {
  el: HTMLElement;
}

export default class VanillaApp {
  el: HTMLElement;
  state: IAppState;

  ws: WebSocketService = new WebSocketService();
  webRtc: WebRTCService = new WebRTCService(this.ws);
  preoccupyTransport: CustomTransport | null = null;


  constructor({el, appMode}: IVanillaAppProps) {
    this.el = el;

    this.state = {
      appMode,
      name: null,
      messages: [],
      showLog: false
    }
  }

  render() {
    this.el.innerHTML = `
      <a class="toggleapp" ${!this.state.appMode ? 'hidden' : ''} data-onclick="handleOnMinimizeClick" href="#">Toggle</a>
      <div class="container ${this.state.appMode ? 'appmode' : '' }">
        <div class="row">
          <div class="col">
            <div class="videoWrapper">
              <video autoplay muted id="localVideo" class="video"></video>
            </div>
            <button data-onclick="handleOnToggleVideoClick">Toggle video</button>
          </div>
          <div>
            <div class="videoWrapper">
              <video autoplay muted id="remoteVideo" class="video"></video>
              <div tabindex="-1" id="pad" class="pad"></div>
            </div>
            <button data-onclick="handleOnToggleVideoClick">Toggle video</button>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <button data-onclick="handleOnRegisterClick" variant="primary">Register</button>
          </div>
          <div class="col">
            <button data-onclick="handleOnStartCallClick" variant="success">Call</button>
            <button variant="danger">Abort call</button>
            <a href=${bookmarklet}>Help me!</a>
          </div>
          <div class="col">Logged in as: <span class="username"></span></div>
        </div>
        <div class="row">
          <div class="col"></div>
          <div class="col">
            <button data-onclick="initPreoccupyjsHost">Init Host</button>
            <button data-onclick="initPreoccupyjsClient">Init Client</button>
          </div>
          <div class="col"></div>
        </div>
        <div class="row" hidden="true">
          <div class="col">
            <input class="message-to" placeholder="Message to..." type="text"/>
            <textarea class="message-body" placeholder="Message body..."></textarea>
          </div>
          <div class="col">
            <button data-onclick="handleOnSendMessageClick" variant="secondary">Send message</button>
          </div>
          <div class="col">
            <label htmlFor="checkbox">Show messages</label>
            <input data-onchange="handleOnChangeShowMessages" id="showmessages" type="checkbox"/>
            <h3>Messages</h3>
            <div class="messages"></div>
          </div>
        </div>
      </div>`;

      this.renderMessages();
      this.initHandlers();
  }

  renderMessages() {
    const root = this.el.querySelector('.messages');
    if (!root) {
      throw new Error('No root el for messages');
    }

    if (!this.state.showLog) {
      return;
    }

    root.innerHTML = this.state.messages.map(mess => {
      return `<div class="message">
        <h3>${mess.from}</h3>
        <pre>${mess.message}</pre>
      </div>`
    }).join('<hr>');
  }

  
  renderName() {
    const root = this.el.querySelector('.username');
    if (!root) {
      throw new Error('No root el for username');
    }

    if (!this.state.name) {
      return;
    }

    root.innerHTML = this.state.name;
  }

  initHandlers() {
    ['onclick', 'onchange'].forEach(eventName => {
      this.el.querySelectorAll<HTMLElement>(`[data-${eventName}]`).forEach((el) => {
        const handlerName: string = el.dataset.onclick as string;
  
        (el as any)[eventName] = (this as any)[handlerName];
      });
    });
  }

  setState(state: Partial<IAppState>) {
    this.state = {
      ...this.state,
      ...state,
    }
  }

  init() {
    this.render();
    this.ws.connect();

    this.ws.on('register', ({result, name}) => {
      this.setState({name: result && name ? name : null});
      this.renderName();
    });

    this.ws.on('communticate', (message: IMessage) => {
      this.setState({
        messages: [
          ...this.state.messages,
          message
        ]
      })
    });
    
    this.webRtc.on('communticate', (message: IMessage) => {
      
      if (this.preoccupyTransport) {
        this.preoccupyTransport.onMessage(message.message);
      }
      
      this.setState({
        messages: [
          ...this.state.messages,
          message
        ]
      })
    });

    this.initWebRTC();
  }

  handleOnMinimizeClick = (event: MouseEvent) => {
    event.preventDefault();
    const container = this.el.querySelector('.container') as HTMLDivElement;

    container.hidden = !container.hidden;
  }

  handleOnToggleVideoClick = (event: MouseEvent) => {
    const videoWrapper = (event.target as HTMLElement).previousElementSibling as HTMLElement;
    const videoEl = videoWrapper.querySelector<HTMLVideoElement>('video') as HTMLVideoElement;
    
    if (videoWrapper.hidden) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
    
    videoWrapper.hidden = !videoWrapper.hidden;
  }

  handleOnRegisterClick = () => {
    const name = prompt('Enter a name');
    if (name) {
      this.ws.register(name);
    }
  }

  handleOnStartCallClick = () => {
    const nameValue = prompt('Enter the peer name');
    if (!nameValue) {
      return;
    }

    this.webRtc.grabScreen().then(() => this.webRtc.start(nameValue));
  }

  handleOnSendMessageClick = () => {
    const nameValueEl = this.el.querySelector<HTMLInputElement>('.message-to');
    const messageValueEl = this.el.querySelector<HTMLTextAreaElement>('.message-body');

    if (!nameValueEl || !messageValueEl || !nameValueEl.value || !messageValueEl.value) {
      return;
    }

    if (this.webRtc.dataChannel) {
      this.webRtc.communicate(messageValueEl.value);
    } else {
      this.ws.communicate(nameValueEl.value, messageValueEl.value);
    }
    
  }

  handleOnChangeShowMessages = (event: any) => {
    this.setState({showLog: event.target.checked});
    this.renderMessages();
  }

  private initWebRTC() {
    this.webRtc.init('localVideo', 'remoteVideo');

    if (!this.state.appMode) {
      this.webRtc.grabCamera();
    }
  }
  
  private initPreoccupyjsHost = () => {
    const webRtc = this.webRtc;

    const transport = new CustomTransport({
      send: (message: object) => webRtc.communicate(JSON.stringify(message))
    });
    const host = new Host(transport, document.getElementById('pad') as HTMLElement);
    host.start();
    
    this.preoccupyTransport = transport;
  }
  
  private initPreoccupyjsClient = () => {
    const webRtc = this.webRtc;

    const transport = new CustomTransport({
      send: (message) => webRtc.communicate(JSON.stringify(message))
    });
    
    const client = createClient(document.body, transport);
    client.start();

    this.preoccupyTransport = transport;
  }
  
}
