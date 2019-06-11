import { AbstractTransport, EventEmitter, Message, PreoccupyAction, TransportEvents } from 'preoccupyjs';

export interface TransportOptions {
    filterFn?: (rawMsg: object) => boolean;
    wrapFn?: (data: Message) => object;
    send: (data: string) => void;
}

export default class CustomTransport extends EventEmitter implements AbstractTransport {
  private connected: boolean = false;
  private filterFn: (rawMsg: object) => boolean;
  private wrapFn: (message: Message) => object;
  private sendFn: (data: string) => void;

  constructor(options: TransportOptions) {
    super();
    this.filterFn = options.filterFn === undefined ? rawData => Boolean(rawData) : options.filterFn;
    this.wrapFn =
      options.wrapFn === undefined ? message => ({ data: message.serialize() }) : options.wrapFn;
    
    this.sendFn = options.send;
  }

  public disconnect() {
    this.off();

    this.connected = false;
  }

  public publish(action: PreoccupyAction): void {
    const message = new Message('action', action);
    
    this.sendFn(message.serialize());
  }
  
  public onMessage(rawData: string) {
    const message = Message.parse('|||' + rawData);
    if (!this.filterFn(message)) {
      return;
    }

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