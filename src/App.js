import React, { Component } from 'react';
import ToolBar from './ToolBar';
import './App.css';

const { REACT_APP_BRAMBLE_HOST_URL } = process.env;

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
  };

  ensureFiles = () => {
    return new Promise((resolve, reject) => {
      const fs = window.Bramble.getFileSystem();
      const sh = new fs.Shell();
      const Path = window.Bramble.Filer.Path;
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

  componentDidMount() {
    window.Bramble.load('#bramble-root', {
      url: REACT_APP_BRAMBLE_HOST_URL,
      debug: false,
      useLocationSearch: true,
    });

    window.Bramble.once('error', (error) => {
      console.error('Bramble error', error);
    });

    window.Bramble.on('ready', (bramble) => {
      this.initBramble(bramble);
    });

    window.Bramble.on('readyStateChange', (previous, current) => {
      if (current === window.Bramble.MOUNTABLE) {
        this.ensureFiles().then(() => {
          window.Bramble.mount(projectRoot);
        });
      }
    });
  }

  render() {
    const { bramble } = this.state;

    return (
      <div className={`App ${this.state.modalOpen? 'modal-open' : ''}`}>
        <div className="App-header">
          <div>Viola</div>
        </div>
        {this.state.bramble &&
          <ToolBar bramble={bramble} />
        }
        <div id="bramble-root" className="App-brambleroot"></div>
      </div>
    );
  }
}

export default App;
