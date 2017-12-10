import React from 'react';
import url from 'url';
import classnames from 'classnames';
import { IconButton, SelectiveRippleButton } from './../../ui/Button';
import { ContextMenu, ContextMenuItem } from './../../ui/ContextMenu';
import './ToolBar.css';

const { REACT_APP_PRINT_PAGE_HOST_URL, REACT_APP_VFS_ROOT_URL } = process.env;

export default class ToolBar extends React.Component {

  props: {
    bramble: any,
    fullscreenEnabled: boolean,
    onFullscreenStatusChanged: (enabled: boolean) => void,
  };

  state = {
    filename: '',
    previewMode: 'desktop',
    sidebarHidden: false,
    editorOptionOpen: false,
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

  onMobilePreviewButtonClick = () => {
    if (this.state.previewMode !== 'mobile') {
      this.props.bramble.useMobilePreview();
      this.setState({ previewMode: 'mobile' });
    }
  };

  onDesktopPreviewButtonClick = () => {
    if (this.state.previewMode !== 'desktop') {
      this.props.bramble.useDesktopPreview();
      this.setState({ previewMode: 'desktop' });
    }
  };

  onPrintPreviewButtonClick = () => {
    if (this.state.previewMode !== 'print') {
      this.props.bramble.usePrintPreview();
      this.setState({ previewMode: 'print' });
    }
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
    if (this.props.fullscreenEnabled) {
      this.props.bramble.disableFullscreenPreview();
    }
    else {
      this.props.bramble.enableFullscreenPreview();
    }

    this.props.onFullscreenStatusChanged(!this.props.fullscreenEnabled);
  };

  onOpenPrintPageButtonClick = () => {
    let editingFilePath = this.props.bramble.getFullPath();
    if (editingFilePath[0] === '/') {
      editingFilePath = editingFilePath.slice(1);
    }
    const targetUrl = url.resolve(REACT_APP_VFS_ROOT_URL, editingFilePath);
    const openUrl = `${REACT_APP_PRINT_PAGE_HOST_URL}?render=${encodeURIComponent(targetUrl)}`;
    window.open(openUrl, 'Viola print page', 'width=800,height=600');
  }

  onExportButtonClick = () => {
    this.setState({
      editorOptionOpen: false,
    });
    this.props.bramble.export();
  };

  componentWillMount() {
    this.initBramble(this.props.bramble);
  }

  render() {
    const { sidebarHidden, editorOptionOpen } = this.state;

    return (
      <div className={classnames('ToolBar', { 'sidebar-hidden': sidebarHidden })}>
        {!sidebarHidden &&
          <div className="ToolBar-filetree_pane" ref={it => this.filetreePaneElement = it}>
            <div className="ToolBar-filetree_left">
              <IconButton name="caret-square-o-left" onClick={this.onHideSidebarButtlnClick} />
            </div>
            <div className="ToolBar-filetree_right">
              <IconButton name="upload" onClick={this.onUploadButtonClick} />
              <IconButton name="plus" onClick={this.onCreateNewFileButtonClick} />
              <IconButton name="folder" onClick={this.onCreateNewFolderButtonClick} />
            </div>
          </div>
        }
        <div className="ToolBar-editor_pane" ref={it => this.editorPaneElement = it}>
          <div className="ToolBar-editor_left">
            {sidebarHidden &&
              <IconButton name="caret-square-o-right" onClick={this.onShowSidebarButtlnClick} />
            }
            <span className="ToolBar-filename">{this.state.filename}</span>
          </div>
          <div className="ToolBar-editor_right">
            <IconButton name="cog" onClick={() => { this.setState({ editorOptionOpen: !editorOptionOpen }); }} />
            {editorOptionOpen &&
              <ContextMenu onClick={() => { this.setState({ editorOptionOpen: false }); }}>
                <ContextMenuItem onClick={this.onOpenPrintPageButtonClick}>印刷ページを開く</ContextMenuItem>
                <ContextMenuItem onClick={this.onExportButtonClick}>プロジェクトをダウンロード</ContextMenuItem>
              </ContextMenu>
            }
          </div>
        </div>
        <div className="ToolBar-preview_pane" ref={it => this.previewPaneElement = it}>
          <div className="ToolBar-preview_left">
            <SelectiveRippleButton initialActiveIndex={1}
              data={[
                { name: 'mobile', onClick: this.onMobilePreviewButtonClick },
                { name: 'desktop', onClick: this.onDesktopPreviewButtonClick },
                { name: 'print', onClick: this.onPrintPreviewButtonClick },
              ]}
            />
          </div>
          <div className="ToolBar-preview_right">
            <IconButton black name="expand" onClick={this.onFullscreenButtonClick} />
            {this.props.fullscreenEnabled &&
              <IconButton opaque name="compress"
                className="ToolBar-disable_fullscreen_button"
                onClick={this.onFullscreenButtonClick}
              />
            }
          </div>
        </div>
      </div>
    );
  }
}
