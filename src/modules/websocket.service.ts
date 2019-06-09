const SOCKET_URL = 'wss://r12aimxa21.execute-api.eu-west-2.amazonaws.com/Prod';

export interface IMessage {
  from: string;
  to?: string;
  message: string;
}

export default class WebSocketService {
  ws: WebSocket | null = null;
  user: string | null = null;
  onMessageCb: (msg: any) => void = () => {};
  onRegisterCb: (result: boolean, name?: string) => void = () => {};

  setUser(user: string) {
    this.user = user;
  }

  onMessage(cb: (msg: any) => void) {
    this.onMessageCb = cb;
  }

  onRegister(cb: (result: boolean, name?: string) => void) {
    this.onRegisterCb = cb;
  }

  connect() {
    this.ws = new WebSocket(SOCKET_URL);
    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.action) {
        case 'registerSuccess':
          this.onRegisterCb(true, data.payload);
          break;
        
        case 'communticate':
          this.onMessageCb(data.payload);
          break;
      
        default:
          this.onRegisterCb(false);
          break;
      }
    }
  }

  send(data: any) {
    if (!this.ws) {
      throw new Error('Connection is lost or has not been established yet');
    }

    if (this.user) {
      data.from = this.user;
    }

    this.ws.send(JSON.stringify({
      message: 'sendmessage',
      data
    }));
  }

  register(name: string) {
    this.send({
      action: 'register',
      payload: name
    });
  }

  communicate(to: string, message:string) {
    this.send({
      action: 'communicate',
      payload: {
        to,
        message
      }
    });
  }
}