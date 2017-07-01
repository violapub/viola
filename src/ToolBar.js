import React from 'react';
import './App.css';

export default class ToolBar extends React.Component {

  props: {
    bramble: any,
  };

  state = {
    filetreePaneWidth: 0,
    editorPaneWidth: 0,
    previewPaneWidth: 0,
    filename: '',
    isMobilePreview: false,
    isPrintPreview: false,
  };

  initBramble = (bramble) => {
    let nextState = Object.assign({}, this.state);
    if (bramble.getLayout()) {
      const data = bramble.getLayout();
      nextState = Object.assign(nextState, {
        filetreePaneWidth: data.sidebarWidth,
        editorPaneWidth: data.firstPaneWidth,
        previewPaneWidth: data.secondPaneWidth,
      });
    }
    if (bramble.getFilename()) {
      nextState = Object.assign(nextState, {
        filename: bramble.getFilename(),
      });
    }
    this.setState(nextState);

    bramble.on('layout', this.updateLayout);
    bramble.on('activeEditorChange', (data) => {
      this.setNavFilename(data.filename);
    });
  };

  updateLayout = (data) => {
    this.setState(Object.assign({}, this.state, {
      filetreePaneWidth: data.sidebarWidth,
      editorPaneWidth: data.firstPaneWidth,
      previewPaneWidth: data.secondPaneWidth,
    }));
  };

  setNavFilename = (filename) => {
    this.setState(Object.assign({}, this.state, {
      filename,
    }));
  };

  onMobileCheckboxChange = () => {
    if (this.state.isMobilePreview) {
      this.props.bramble.useDesktopPreview();
    }
    else {
      this.props.bramble.useMobilePreview();
    }

    this.setState(Object.assign({}, this.state, {
      isMobilePreview: !this.state.isMobilePreview,
    }));
  };

  onPrintCheckboxChange = () => {
    if (this.state.isPrintPreview) {
      if (this.state.isMobilePreview) {
        this.props.bramble.useMobilePreview();
      }
      else {
        this.props.bramble.useDesktopPreview();
      }
    }
    else {
      this.props.bramble.usePrintPreview();
    }
    this.setState(Object.assign({}, this.state, {
      isPrintPreview: !this.state.isPrintPreview,
    }));
  };

  componentWillMount() {
    this.initBramble(this.props.bramble);
  }

  render() {
    const {
      filetreePaneWidth,
      editorPaneWidth,
      previewPaneWidth,
    } = this.state;

    return (
      <div className="ToolBar">
        <div className="ToolBar-filetree_pane" style={{ flexBasis: filetreePaneWidth }}></div>
        <div className="ToolBar-editor_pane" style={{ flexBasis: editorPaneWidth }}>
          <span className="ToolBar-filename">{this.state.filename}</span>
        </div>
        <div className="ToolBar-preview_pane" style={{ flexBasis: previewPaneWidth }}>
          <label>
            <input type="checkbox" checked={this.state.isMobilePreview}
              disabled={this.state.isPrintPreview}
              onChange={this.onMobileCheckboxChange}
            />
            Mobile preview
          </label>
          <label>
            <input type="checkbox" checked={this.state.isPrintPreview}
              onChange={this.onPrintCheckboxChange}
            />
            Print preview
          </label>
        </div>
      </div>
    );
  }
}
