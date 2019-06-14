import React, { RefObject } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Host, createClient } from 'preoccupyjs';
import VideoScreen from './components/video-screen/VideoScreen';
import './App.css';
import WebSocketService, { IMessage } from './modules/websocket.service';
import Message from './components/message/Message';
import WebRTCService from './modules/webrtc.service';
import CustomTransport from './modules/preoccupy.transport';

/* eslint import/no-webpack-loader-syntax: off */
//@ts-ignore
import bookmarklet from './assets/bookmarklet.bundle';

interface IAppState {
  name: string | null;
  messages: IMessage[];
  appMode: boolean;
}

export interface IAppProps {
  appMode: boolean;
}

class App extends React.Component<IAppProps, IAppState> {
  ws: WebSocketService = new WebSocketService();
  webRtc: WebRTCService = new WebRTCService(this.ws);
  preoccupyTransport: CustomTransport | null = null;
  

  toNameRef: RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();
  toMessageRef: RefObject<HTMLTextAreaElement> = React.createRef<HTMLTextAreaElement>();

  constructor(props: IAppProps) {
    super(props);

    this.state = {
      name: null,
      messages: [],
      appMode: props.appMode
    };
  }

  render() {
    return (
      <Container className={this.props.appMode ? 'appmode' : '' }>
        <Row>
          <Col>
            <VideoScreen idAttr="localVideo" />
          </Col>
          <Col>
            <div className="remoteVideoScree">
              <VideoScreen idAttr="remoteVideo" />
              <div id="pad" className="pad"></div> 
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <Button onClick={() => this.handleOnRegisterClick()} variant="primary">Register</Button>
          </Col>
          <Col>
            <Button onClick={this.handleOnStartCallClick} variant="success">Call</Button>
            <Button variant="danger">Abort call</Button>
            <a href={bookmarklet}>Add to favs!</a>
          </Col>
          <Col>Logged in as: {this.state.name}</Col>
        </Row>
        <Row>
          <Col></Col>
          <Col>
            <Button onClick={this.initPreoccupyjsHost} >Init Host</Button>
            <Button onClick={this.initPreoccupyjsClient}>Init Clinet</Button>
          </Col>
          <Col></Col>
        </Row>
        <Row>
          <Col>
            <input ref={this.toNameRef} placeholder="Message to..." type="text"/>
            <textarea ref={this.toMessageRef} placeholder="Message body..."></textarea>
          </Col>
          <Col>
            <Button onClick={this.handleOnSendMessageClick} variant="secondary">Send message</Button>
          </Col>
          <Col>
            <div className="messages">
              Messages: {this.state.messages.map((message, index) => (
                <div>
                  <Message key={index} item={message} />
                  <hr/>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  componentDidMount() {
    this.ws.connect();

    this.ws.on('register', ({result, name}) => {
      this.setState({name: result && name ? name : null});
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

  handleOnRegisterClick() {
    const name = prompt('Enter a name');
    if (name) {
      this.ws.register(name);
    }
  }

  handleOnStartCallClick = () => {
    const nameValue = this.toNameRef.current && this.toNameRef.current.value;
    if (!nameValue) {
      return;
    }

    this.webRtc.grabScreen().then(() => {
      this.webRtc.start(nameValue);
    });
    
  }

  handleOnSendMessageClick = () => {
    const nameValue = this.toNameRef.current && this.toNameRef.current.value;
    const messageValue = this.toMessageRef.current && this.toMessageRef.current.value;

    if (!nameValue || !messageValue) {
      return;
    }

    if (this.webRtc.dataChannel) {
      this.webRtc.communicate(messageValue);
    } else {
      this.ws.communicate(nameValue, messageValue);
    }
    
  }

  private initWebRTC() {
    this.webRtc.init('localVideo', 'remoteVideo');
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

export default App;
