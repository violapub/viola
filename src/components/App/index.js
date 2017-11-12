import React, { Component } from 'react';
import classnames from 'classnames';
import { StatusIndicator } from './../../ui/StatusIndicator';
import ToolBar from './../ToolBar';
import './App.css';

const { REACT_APP_BRAMBLE_HOST_URL } = process.env;

// eslint-disable-next-line
const Bramble = window.Bramble;

const projectRoot = '/viola';
const indexTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Viola index page</title>
  </head>
  <body>
    <h2>Welcome to Viola</h2>
    <p>Write your awesome story.</p>
  </body>
</html>
`;

class App extends Component {

  state = {
    bramble: null,
    modalOpen: false,
    hideSpinner: false,
    spinnerDisplayMode: 'flex',
    fullscreenEnabled: false,
  };

  ensureFiles = () => {
    return new Promise((resolve, reject) => {
      const fs = Bramble.getFileSystem();
      const sh = new fs.Shell();
      const Path = Bramble.Filer.Path;
      const indexPath = Path.join(projectRoot, 'index.html');

      function prepareIndexPage(callback) {
        fs.exists(indexPath, (exists) => {
          if (exists) {
            callback();
          }
          else {
            fs.writeFile(indexPath, indexTemplate, (err) => {
              if (err) throw err;
              callback();
            });
          }
        });
      }

      try {
        fs.exists(projectRoot, (exists) => {
          if (exists) {
            prepareIndexPage(resolve);
          }
          else {
            sh.mkdirp(projectRoot, (err) => {
              if (err) throw err;
              prepareIndexPage(resolve);
            });
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  initBramble = (bramble) => {
    bramble.showSidebar();
    bramble.on('dialogOpened', () => {
      this.setState(Object.assign({}, this.state, {
        modalOpen: true,
      }));
    });
    bramble.on('dialogClosed', () => {
      this.setState(Object.assign({}, this.state, {
        modalOpen: false,
      }));
    });

    this.setState(Object.assign({}, this.state, {
      bramble: bramble,
    }));
  };

  onFullscreenStatusChanged = (fullscreenEnabled) => {
    this.setState({ fullscreenEnabled });
  };

  componentDidMount() {
    Bramble.load('#bramble-root', {
      url: REACT_APP_BRAMBLE_HOST_URL,
      // debug: false,
      // useLocationSearch: true,
      hideUntilReady: true,
      zipFilenamePrefix: 'viola-project',
      capacity: 50 * 1000 * 1000,
    });

    Bramble.once('error', (error) => {
      console.error('Bramble error', error);
    });

    Bramble.on('ready', (bramble) => {
      this.initBramble(bramble);

      this.setState(Object.assign({}, this.state, {
        hideSpinner: true,
      }));
      setTimeout(() => {
        this.setState(Object.assign({}, this.state, {
          spinnerDisplayMode: 'none',
        }));
      }, 1000);
    });

    Bramble.on('readyStateChange', (previous, current) => {
      if (current === Bramble.MOUNTABLE) {
        this.ensureFiles().then(() => {
          Bramble.mount(projectRoot);
        });
      }
    });
  }

  render() {
    const { bramble, hideSpinner, spinnerDisplayMode, fullscreenEnabled } = this.state;
    const appClasses = classnames('App', {
      'modal-open': this.state.modalOpen,
      'fullscreen': this.state.fullscreenEnabled,
    });

    return (
      <div className={appClasses}>
        <nav className="App-header">
          <h1 className="App-header-title">
            Viola
          </h1>
          <div className="App-header-lr">
            <div className="App-header-left">
            </div>
            <div className="App-header-right">
              <StatusIndicator />
            </div>
          </div>
        </nav>
        {this.state.bramble &&
          <ToolBar bramble={bramble}
            fullscreenEnabled={fullscreenEnabled}
            onFullscreenStatusChanged={this.onFullscreenStatusChanged}
          />
        }
        <div id="bramble-root" className="App-brambleroot"></div>
        <div className={`App-spinner_container ${hideSpinner? 'hidden' : ''}`}
          style={{ display: spinnerDisplayMode }}
        >
          <div className="App-spinner"></div>
        </div>
      </div>
    );
  }
}

export default App;
