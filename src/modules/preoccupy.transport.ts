import { AbstractTransport, EventEmitter, Message, PreoccupyAction, TransportEvents } from 'preoccupyjs';

export interface TransportOptions {
    filterFn?: (rawMsg: object) => boolean;
    wrapFn?: (data: Message) => object;
    send: (data: object) => void;
}

export default class CustomTransport extends EventEmitter implements AbstractTransport {
  private connected: boolean = false;
  private filterFn: (rawData: any) => string | null;
  private wrapFn: (message: Message) => object;
  private sendFn: (data: object) => void;

  constructor(options: TransportOptions) {
    super();
    this.filterFn = (rawData: any) => {
      try {
        const parsedMsg = JSON.parse(rawData);
        if (!!parsedMsg.preoccupy) {
          return parsedMsg.preoccupy;
        }
      } catch (e) {
        return null;
      }
      
      return null;
    };
    this.wrapFn = (message: Message) => ({ preoccupy: message.serialize() });
    
    this.sendFn = options.send;
  }

  public disconnect() {
    this.off();

    this.connected = false;
  }

  public publish(action: PreoccupyAction): void {
    const message = new Message('action', action);
    
    this.sendFn(this.wrapFn(message));
  }
  
  public onMessage(rawData: string) {
    const msgData = this.filterFn(rawData);
    if (!msgData) {
      return;
    }
    
    const message = Message.parse('|||' + msgData);
    console.log(msgData, message);

    this.trigger(TransportEvents.action, message);
  }

  public handshake() {
    if (this.connected) {
      this.trigger(TransportEvents.connect);
    } else {
      this.connect();
    }
  }

  public connect() {
    this.trigger(TransportEvents.connect, null);
  }
}