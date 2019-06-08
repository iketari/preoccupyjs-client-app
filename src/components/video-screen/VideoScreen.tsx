import React from 'react';
import './VideoScreen.css';

export interface IVideoScreenProps {
  idAttr: string;
}

export default class VideoScreen extends React.Component<IVideoScreenProps, any> {
  // constructor(props: IVideoScreenProps) {
  //   super(props);
  // }

  render() {
    return (
      <video id={this.props.idAttr} className="video"></video>
    );
  }
}
// const VideoScreen: React.FC = (props: VideoScreenProps) => {
//   console.log(props);
//   return (
//     <video id="{props.idAttr}" className="video"></video>
//   );
// }

// export default VideoScreen;
