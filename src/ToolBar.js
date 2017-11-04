import React from 'react';
import {Icon} from 'react-fa';
import './App.css';

export default class ToolBar extends React.Component {

  props: {
    bramble: any,
  };

  state = {
    filename: '',
    isMobilePreview: false,
    isPrintPreview: false,
    isFullscreenPreview: false,
    sidebarHidden: false,
  };

  initBramble = (bramble) => {
    let nextState = Object.assign({}, this.state);
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
    if (this.filetreePaneElement) {
      this.filetreePaneElement.style.flexBasis = `${data.sidebarWidth}px`;
    }
    if (this.editorPaneElement) {
      this.editorPaneElement.style.flexBasis = `${data.firstPaneWidth}px`;
    }
    if (this.previewPaneElement) {
      this.previewPaneElement.style.flexBasis = `${data.secondPaneWidth}px`;
    }
  };

  setNavFilename = (filename) => {
    this.setState(Object.assign({}, this.state, {
      filename,
    }));
  };

  onHideSidebarButtlnClick = () => {
    if (!this.state.sidebarHidden) {
      this.props.bramble.hideSidebar();
      this.setState(Object.assign({}, this.state, {
        sidebarHidden: true,
      }));
    }
  };

  onShowSidebarButtlnClick = () => {
    if (this.state.sidebarHidden) {
      this.props.bramble.showSidebar();
      this.setState(Object.assign({}, this.state, {
        sidebarHidden: false,
      }));
    }
  };

  onUploadButtonClick = () => {
    this.props.bramble.showUploadFilesDialog();
  };

  onCreateNewFileButtonClick = () => {
    // this.props.bramble.addNewFile({
    //   contents: '',
    // });
    this.props.bramble.createNewFile();
  };

  onCreateNewFolderButtonClick = () => {
    this.props.bramble.addNewFolder();
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

  onFullscreenButtonClick = () => {
    if (this.state.isFullscreenPreview) {
      this.props.bramble.disableFullscreenPreview();
    }
    else {
      this.props.bramble.enableFullscreenPreview();
    }

    this.setState(Object.assign({}, this.state, {
      isFullscreenPreview: !this.state.isFullscreenPreview,
    }));
  };

  onOpenPrintPageButtonClick = () => {
    const targetUrl = 'http://localhost:8000/dist/vfs' + this.props.bramble.getFullPath();
    const openUrl = `http://localhost:8000/dist/print.html?render=${encodeURIComponent(targetUrl)}`;
    window.open(openUrl, 'Viola print page', 'width=800,height=600');
  }

  componentWillMount() {
    this.initBramble(this.props.bramble);
  }

  render() {
    const { sidebarHidden } = this.state;

    return (
      <div className={`ToolBar ${sidebarHidden && 'sidebar-hidden'}`}>
        {!sidebarHidden &&
          <div className="ToolBar-filetree_pane" ref={it => this.filetreePaneElement = it}>
            <div className="ToolBar-filetree_left">
              <div className="ToolBar-button" onClick={this.onHideSidebarButtlnClick}>
                <Icon name="caret-square-o-left" />
              </div>
            </div>
            <div className="ToolBar-filetree_right">
              <div className="ToolBar-button" onClick={this.onUploadButtonClick}>
                <Icon name="upload" />
              </div>
              <div className="ToolBar-button" onClick={this.onCreateNewFileButtonClick}>
                <Icon name="plus" />
              </div>
              <div className="ToolBar-button" onClick={this.onCreateNewFolderButtonClick}>
                <Icon name="folder" />
              </div>
            </div>
          </div>
        }
        <div className="ToolBar-editor_pane" ref={it => this.editorPaneElement = it}>
          {sidebarHidden &&
            <div className="ToolBar-button" onClick={this.onShowSidebarButtlnClick}>
              <Icon name="caret-square-o-right" />
            </div>
          }
          <span className="ToolBar-filename">{this.state.filename}</span>
        </div>
        <div className="ToolBar-preview_pane" ref={it => this.previewPaneElement = it}>
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
          <button onClick={this.onFullscreenButtonClick}>
            fullscreen
          </button>
          <button onClick={this.onOpenPrintPageButtonClick}>
            openPrintPage
          </button>
        </div>
      </div>
    );
  }
}
