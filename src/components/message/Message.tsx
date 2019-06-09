import React from 'react';
import { IMessage } from '../../modules/websocket.service';
import './Message.css';

export interface IMessageProps {
  item: IMessage
}

export default class Message extends React.Component<IMessageProps, object> {
  render() {
    return (<div className="message">
      <span className="message__title">{this.props.item.from}</span>
      <div>{this.props.item.message}</div>
    </div>);
  }
}