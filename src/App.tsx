import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import VideoScreen from './components/video-screen/VideoScreen';
import './App.css';
import WebSocketService from './modules/websocket.service';

interface IAppState {
  name: string | null;
}

class App extends React.Component<unknown, IAppState> {
  ws: WebSocketService = new WebSocketService();

  constructor(props: unknown) {
    super(props);
    this.state = {
      name: null
    };
  }

  render() {
    return (
      <Container>
        <Row>
          <Col>
            <VideoScreen idAttr="self" />
          </Col>
          <Col>
            <VideoScreen idAttr="remote" />
          </Col>
        </Row>
        <Row>
          <Col>
            <Button onClick={() => this.handleOnRegisterClick()} variant="success">Register</Button>
          </Col>
          <Col>
            <Button variant="danger">Abort call</Button>
          </Col>
          <Col>Logged in as: {this.state.name}</Col>
        </Row>
      </Container>
    );
  }

  componentWillMount() {
    this.ws.connect();

    this.ws.onRegister((result, name) => {
      this.setState({name: result && name ? name : null});
    });

    this.ws.onMessage((msg) => {
      console.log(msg);
    });
  }

  handleOnRegisterClick() {
    const name = prompt('Enter a name');
    if (name) {
      this.ws.register(name);
    }
  }
}

export default App;
