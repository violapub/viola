import React from 'react';
import './../src/index.css';

export default class StorybookContainer extends React.Component {
  render() {
    const { story } = this.props;

    return (
      <div
        style={{
          padding: '3em',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {story()}
      </div>
    );
  }
}
