import React, { RefObject } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Host, createClient } from 'preoccupyjs';
import VideoScreen from './components/video-screen/VideoScreen';
import './App.css';
import WebSocketService, { IMessage } from './modules/websocket.service';
import Message from './components/message/Message';
import WebRTCService from './modules/webrtc.service';
import CustomTransport from './modules/preoccupy.transport';


interface IAppState {
  name: string | null;
  messages: IMessage[];
}

class App extends React.Component<unknown, IAppState> {
  ws: WebSocketService = new WebSocketService();
  webRtc: WebRTCService = new WebRTCService(this.ws);

  toNameRef: RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();
  toMessageRef: RefObject<HTMLTextAreaElement> = React.createRef<HTMLTextAreaElement>();

  constructor(props: unknown) {
    super(props);

    this.state = {
      name: null,
      messages: []
    };
  }

  render() {
    return (
      <Container>
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
            Messages: {this.state.messages.map((message, index) => (
              <div key={index}>
                <Message item={message} />
                <hr/>
              </div>
            ))}
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
      this.setState({
        messages: [
          ...this.state.messages,
          message
        ]
      })
    });

    this.initWebRTC();
    this.initPreoccupyjs();
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
  
  private initPreoccupyjsHost() {
    const transport = new CustomTransport({
      send: (message) => this.webRtc.communicate(message),
      filterFn: (message) => {
        console.log(message);
        return false;
      }
    });
    const host = new Host(transport, document.getElementById('pad') as HTMLElement);
    
    host.start();
    
  }
  
  private initPreoccupyjsClient() {
    const transport = new CustomTransport({
      send: (message) => this.webRtc.communicate(message),
      filterFn: (message) => {
        console.log(message);
        return false;
      }
    });
    
    const client = createClient(document.body, transport);
    
    client.start();
  }
}

export default App;
