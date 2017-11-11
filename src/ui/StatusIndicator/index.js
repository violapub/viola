import React from 'react';
import classnames from 'classnames';
import './StatusIndicator.css';

class StatusIndicator extends React.PureComponent {
  state = {
    connectionStatus: '',
  }

  handleOnline = () => {
    this.setState({ connectionStatus: 'connected' });
  };

  handleOffline = () => {
    this.setState({ connectionStatus: 'disconnected' });
  };

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.setState({
      connectionStatus: window.navigator.onLine? 'connected' : 'disconnected',
    });
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  render() {
    const { connectionStatus } = this.state;
    const connectionMessage = connectionStatus === 'connected' ? 'Online'
                            : connectionStatus === 'disconnected' ? 'Offline'
                            : '';

    return (
      <div className="StatusIndicator">
        <div className={classnames('StatusIndicator_connection-info', connectionStatus)}>
          <span className="StatusIndicator_connection-dot" />
          <div className="StatusIndicator_connection-message">{connectionMessage}</div>
        </div>
      </div>
    );
  }
}

export {
  StatusIndicator,
};
