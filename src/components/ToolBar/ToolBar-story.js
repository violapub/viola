import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import ToolBar from './index';

const brambleStub = {
  getFilename: () => null,
  getPreviewURL: () => null,
  on: () => {},
  hideSidebar: () => {},
  showSidebar: () => {},
  showUploadFilesDialog: () => {},
  createNewFile: () => {},
  addNewFolder: () => {},
  useMobilePreview: () => {},
  useDesktopPreview: () => {},
  usePrintPreview: () => {},
  enableFullscreenPreview: () => {},
  disableFullscreenPreview: () => {},
  export: () => {},
};

storiesOf('ToolBar', module)
  .add('ToolBar', () => {

    return (
      <div style={{ width: '100%' }}>
        <ToolBar bramble={brambleStub}
          fullscreenEnabled={false}
          sidebarHidden={false}
          onFullscreenStatusChanged={action('fullscreen status changed')}
          onSidebarVisibilityChanged={action('sidebar visibility changed')}
        />
      </div>
    );
  })
