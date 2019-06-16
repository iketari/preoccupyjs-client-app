import React from 'react';
import './VideoScreen.css';

export interface IVideoScreenProps {
  idAttr: string;
  pad: boolean;
}

export default class VideoScreen extends React.Component<IVideoScreenProps, any> {
  render() {
    const padEl = this.props.pad ? <div tabIndex={-1} id="pad" className="pad"></div>  : null;
    return (
      <div className="videoWrapper">
      <video autoPlay muted id={this.props.idAttr} className="video"></video>
      {padEl}
      </div>
    );
  }
}