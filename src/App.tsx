import React, { RefObject } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import VideoScreen from './components/video-screen/VideoScreen';
import './App.css';
import WebSocketService, { IMessage } from './modules/websocket.service';
import Message from './components/message/Message';
import WebRTCService from './modules/webrtc.service';

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
            <VideoScreen idAttr="remoteVideo" />
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

    this.ws.onRegister((result, name) => {
      this.setState({name: result && name ? name : null});
    });

    this.ws.onMessage((message: IMessage) => {
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

    this.ws.communicate(nameValue, messageValue);
  }

  private initWebRTC() {
    this.webRtc.init('localVideo', 'remoteVideo');
  }
}

export default App;
