import React, { Component } from 'react';
import ToolBar from './ToolBar';
import './App.css';

const projectRoot = '/viola';
const index = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Viola index page</title>
  </head>
  <body>
  </body>
</html>
`;

class App extends Component {

  state = {
    bramble: null,
  };

  ensureFiles = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fs = window.Bramble.getFileSystem();
        console.log(fs);
        fs.exists(projectRoot, (exists) => {
          if (!exists) {
            const sh = new fs.Shell();
            const Path = window.Bramble.Filer.Path;
            sh.mkdirp(projectRoot, (err) => {
              if (err && err.code !== 'EEXIST') {
                reject(err);
              }
            });
            fs.writeFile(Path.join(projectRoot, ''), index, () => {
              resolve();
            });
          }
          resolve();
        });
      }, 1000);
    });
  }

  componentDidMount() {
    window.Bramble.load('#bramble-root', {
      url: 'http://localhost:8000/dist/index.html',
      debug: true,
      useLocationSearch: true,
    });

    window.Bramble.once('error', (error) => {
      console.error('Bramble error', error);
    });

    window.Bramble.on('ready', (bramble) => {
      this.setState({
        bramble: bramble,
      })
    });

    this.ensureFiles().then(() => {
      window.Bramble.mount(projectRoot, 'index.html');
    });
  }

  render() {
    const { bramble } = this.state;

    return (
      <div className="App">
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
