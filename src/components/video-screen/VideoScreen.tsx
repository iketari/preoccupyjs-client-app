import React from 'react';
import './VideoScreen.css';

export interface IVideoScreenProps {
  idAttr: string;
}

export default class VideoScreen extends React.Component<IVideoScreenProps, any> {
  render() {
    return (
      <video id={this.props.idAttr} className="video"></video>
    );
  }
}