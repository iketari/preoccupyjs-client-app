import WebSocketService, { IMessage } from "./websocket.service";

export interface ISignalMessage {
  uuid: string;
  ice?: RTCIceCandidateInit;
  sdp?: RTCSessionDescriptionInit;
}

interface ISignalMessageSdp extends ISignalMessage {
  sdp: RTCSessionDescriptionInit;
}

export default class WebRTCService {
  peerUserName: string | null = null;
  localVideo: HTMLVideoElement | null = null;
  localStream: MediaStream | null = null;
  remoteVideo: HTMLVideoElement | null = null;
  peerConnection: RTCPeerConnection | null = null;
  uuid: string | null = null;
  
  peerConnectionConfig = {
    'iceServers': [
      {'urls': 'stun:stun.stunprotocol.org:3478'},
      {'urls': 'stun:stun.l.google.com:19302'},
    ]
  };

  constructor(private serverConnection: WebSocketService) {}
  
  init(localVideo: string, remoteVideo: string) {
    this.uuid = this.createUUID();
  
    this.localVideo = document.getElementById(localVideo) as HTMLVideoElement;
    this.remoteVideo = document.getElementById(remoteVideo) as HTMLVideoElement;

    this.serverConnection.onMessage(this.gotMessageFromServer);
  
    const constraints = {
      video: true,
      audio: true,
    };
  
    if(navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.getUserMediaSuccess)
        .catch(this.errorHandler);
    } else {
      alert('Your browser does not support getUserMedia API');
    }
  }

  start(peerUserName?: string) {
    const isCaller = peerUserName !== undefined;
    if (!this.localStream) {
      throw new Error('No localStream');
    }

    const peerConnection = new RTCPeerConnection(this.peerConnectionConfig);
    peerConnection.onicecandidate = this.gotIceCandidate;
    peerConnection.ontrack = this.gotRemoteStream;

    for (const track of this.localStream.getTracks()) {
      peerConnection.addTrack(track, this.localStream);
    }

    this.peerConnection = peerConnection;
  
    if(isCaller) {
      this.peerUserName = peerUserName as string;
      peerConnection.createOffer()
        .then(this.createdDescription)
        .catch(this.errorHandler);
    }
  }

  private gotMessageFromServer = (message: IMessage) => {
    if(!this.peerConnection) {
      this.start();
    }
    const peerConnection = this.peerConnection as RTCPeerConnection;
    let signal: ISignalMessage;
    try {
      signal = JSON.parse(message.message);
    } catch (e) {
      return;
    }
  
    // Ignore messages from ourself
    if(!signal.uuid || signal.uuid === this.uuid) return;
    this.peerUserName = message.from;
  console.log(signal);
    if(signal.sdp) {
      const sdp = (signal as ISignalMessageSdp).sdp;
      peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
      .then(() => {
        // Only create answers in response to offers
        if(sdp.type === 'offer') {
          peerConnection.createAnswer().then(this.createdDescription).catch(this.errorHandler);
        }
      }).catch(this.errorHandler);
    } else if(signal.ice) {
      peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(this.errorHandler);
    }
  }

  private gotIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate != null) {
      this.serverConnection.communicate(this.peerUserName as string, JSON.stringify({
        ice: event.candidate,
        uuid: this.uuid
      }));
    }
  }

  private createdDescription = (description: RTCSessionDescriptionInit) => {
    const peerConnection = this.peerConnection;
    if (!peerConnection) {
      throw new Error('No peerConnection');
    }
  
    peerConnection.setLocalDescription(description).then(() => {
      this.serverConnection
        .communicate(this.peerUserName as string, JSON.stringify({
          'sdp': peerConnection.localDescription,
          'uuid': this.uuid
        }));
    }).catch(this.errorHandler);
  }

  private gotRemoteStream = (event: RTCTrackEvent) => {
    if (!this.remoteVideo) {
      throw new Error('No remoteVideo element');
    }

    this.remoteVideo.srcObject = event.streams[0];
  }

  private getUserMediaSuccess = (stream: MediaStream) => {
    if (!this.localVideo) {
      throw new Error('No localVideo element');
    }
    this.localStream = stream;
    this.localVideo.srcObject = stream;
  }
  
  private errorHandler = (error: any) => {
    console.log(error);
  }
  
  // Taken from http://stackoverflow.com/a/105074/515584
  // Strictly speaking, it's not a real UUID, but it gets the job done here
  private createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

}







