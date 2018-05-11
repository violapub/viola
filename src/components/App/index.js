import React, { Component } from 'react';
import classnames from 'classnames';
import Project from './../../misc/project';
import { Header } from './../../ui/Header';
import { ViolaLogo } from './../../ui/Logo';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './../../ui/Modal';
import { StatusIndicator } from './../../ui/StatusIndicator';
import { ProgressBar } from './../../ui/ProgressBar';
import SideNav from './../SideNav';
import ToolBar from './../ToolBar';
import './App.css';

const {
  REACT_APP_BRAMBLE_HOST_URL,
  REACT_APP_VERSION,
  REACT_APP_VIOLA_HOMEPAGE,
} = process.env;

// eslint-disable-next-line
const Bramble = window.Bramble;

// Constants for displaying loading progress
const PROGRESS_RATE_FOR_LOADING_VIOLA = 0.1;
const PROGRESS_RATE_FOR_LOADING_BRAMBLE = 0.7;
const PROGRESS_RATE_FOR_LOADING_PROJECT = 0.2;

class App extends Component {

  state = {
    bramble: null,
    brambleModalOpen: false,
    hideSpinner: false,
    fontLoaded: false,
    spinnerDisplayMode: 'flex',
    fullscreenEnabled: false,
    sidebarHidden: false,
    loadingViolaProgress: 0,
    loadingBrambleProgress: 0,
    brambleMountable: false,
    user: null,
    appError: null,
  };

  setupProject = async () => {
    const fs = Bramble.getFileSystem();
    const sh = new fs.Shell();
    const path = Bramble.Filer.Path;
    const FilerBuffer = Bramble.Filer.Buffer;

    const project = new Project();
    try {
      await project.initialize({
        ...this.props.data,
        path, fs, sh, FilerBuffer,
      });
    } catch (appError) {
      this.setState({ appError });
    }
    this.setState({
      user: project.session && project.session.user,
    });
  };

  initBramble = (bramble) => {
    bramble.showSidebar();
    bramble.useDarkTheme();   // if not set, sometimes use light theme
    bramble.on('dialogOpened', () => {
      this.setState(Object.assign({}, this.state, {
        brambleModalOpen: true,
      }));
    });
    bramble.on('dialogClosed', () => {
      this.setState(Object.assign({}, this.state, {
        brambleModalOpen: false,
      }));
    });

    this.setState(Object.assign({}, this.state, {
      bramble: bramble,
    }));
  };

  onFullscreenStatusChanged = (fullscreenEnabled) => {
    this.setState({ fullscreenEnabled });
  };

  onSidebarVisibilityChanged = (sidebarHidden) => {
    this.setState({ sidebarHidden });
  }

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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.progress) {
          this.setState({
            loadingViolaProgress: event.data.progress,
          });
        }
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
    Bramble.on('loadingProgressUpdate', (event) => {
      if (event.progress) {
        this.setState({
          loadingBrambleProgress: event.progress,
        });
      }
    });

    Bramble.on('readyStateChange', (previous, current) => {
      if (current === Bramble.MOUNTABLE) {
        this.setState({
          brambleMountable: true,
        });
        this.setupProject();
      }
    });
  }

  render() {
    const {
      bramble,
      brambleModalOpen,
      hideSpinner,
      fontLoaded,
      spinnerDisplayMode,
      fullscreenEnabled,
      sidebarHidden,
      loadingViolaProgress,
      loadingBrambleProgress,
      brambleMountable,
      user,
    } = this.state;
    const appClasses = classnames('App', {
      'modal-open': brambleModalOpen,
      'fullscreen': fullscreenEnabled,
      'sidebar-hidden': sidebarHidden,
    });

    let progressValue = loadingViolaProgress * PROGRESS_RATE_FOR_LOADING_VIOLA
                      + loadingBrambleProgress * PROGRESS_RATE_FOR_LOADING_BRAMBLE;
    if (brambleMountable && progressValue < (1 - PROGRESS_RATE_FOR_LOADING_PROJECT)) {
      progressValue = 1 - PROGRESS_RATE_FOR_LOADING_PROJECT;
    }
    if (bramble) {
      // Application is ready
      progressValue = 1;
    }

    return (
      <div className={appClasses}>
        <Header user={user} homepageURL={REACT_APP_VIOLA_HOMEPAGE} />
        {bramble &&
          <ToolBar bramble={bramble}
            fullscreenEnabled={fullscreenEnabled}
            sidebarHidden={sidebarHidden}
            onFullscreenStatusChanged={this.onFullscreenStatusChanged}
            onSidebarVisibilityChanged={this.onSidebarVisibilityChanged}
          />
        }
        <div id="bramble-root" className="App-brambleroot"></div>
        {bramble &&
          <SideNav bramble={bramble} />
        }
        <div className={`App-loading_container ${hideSpinner? 'hidden' : ''}`}
          style={{ display: spinnerDisplayMode }}
        >
          <div className="App-loading_container_lr">
            {fontLoaded &&
              <ViolaLogo black className="App-loading_logo" />
            }
            <div className="App-loading_message">Starting<br/>Viola</div>
          </div>
          <ProgressBar value={progressValue} max={1} className="App-loading_progress_bar"/>
        </div>
        {this._renderError()}
      </div>
    );
  }

  _renderError = () => {
    const { appError } = this.state;
    if (!appError) {
      return <Modal show={false}></Modal>
    }

    const errMsg = `プロジェクトの読み込みに失敗しました。(${appError.name})`;
    return (
      <Modal show={appError}>
        <React.Fragment>
          <ModalHeader>
            <h2>エラー</h2>
          </ModalHeader>
          <ModalBody>
            {errMsg}
          </ModalBody>
        </React.Fragment>
      </Modal>
    );
  }
}

export default App;
