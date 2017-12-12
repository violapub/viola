import React, { Component } from 'react';
import classnames from 'classnames';
import Project from './../../misc/project';
import { ViolaLogo } from './../../ui/Logo';
import { StatusIndicator } from './../../ui/StatusIndicator';
import ToolBar from './../ToolBar';
import './App.css';

const { REACT_APP_BRAMBLE_HOST_URL, REACT_APP_VERSION } = process.env;

// eslint-disable-next-line
const Bramble = window.Bramble;

let projectRoot = '/viola';
// Use beta subdirectory
if (REACT_APP_VERSION.split('.')[0] === '0') {
  projectRoot += '/beta';
}

class App extends Component {

  state = {
    bramble: null,
    modalOpen: false,
    hideSpinner: false,
    fontLoaded: false,
    spinnerDisplayMode: 'flex',
    fullscreenEnabled: false,
  };

  downloadProject = async () => {
    const fs = Bramble.getFileSystem();
    const sh = new fs.Shell();
    const path = Bramble.Filer.Path;
    const FilerBuffer = Bramble.Filer.Buffer;
    const { projectMeta } = this.props.data;
    const project = new Project({ path, fs, sh, FilerBuffer, projectMeta, projectRoot });

    await project.initialize();
  };

  initBramble = (bramble) => {
    bramble.showSidebar();
    bramble.useDarkTheme();   // if not set, sometimes use light theme
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
    if (window.document.fonts) {
      window.document.fonts.ready.then(fontFaceSet => {
        this.setState({
          fontLoaded: true,
        });
      });
    }
    else {
      this.setState({
        fontLoaded: true,
      });
    }

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
        this.downloadProject().then(() => {
          Bramble.mount(projectRoot);
        });
      }
    });
  }

  render() {
    const { bramble, hideSpinner, fontLoaded, spinnerDisplayMode, fullscreenEnabled } = this.state;
    const appClasses = classnames('App', {
      'modal-open': this.state.modalOpen,
      'fullscreen': this.state.fullscreenEnabled,
    });

    return (
      <div className={appClasses}>
        <nav className="App-header">
          <div className="App-header-title">
            <ViolaLogo white className="App-header-title-logo" />
          </div>
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
        <div className={`App-loading_container ${hideSpinner? 'hidden' : ''}`}
          style={{ display: spinnerDisplayMode }}
        >
          {fontLoaded &&
            <ViolaLogo black className="App-loading_logo" />
          }
          <div className="App-loading_message">Starting<br/>Viola</div>
        </div>
      </div>
    );
  }
}

export default App;
