import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { ContextMenu, ContextMenuItem, ContextMenuDivider } from './index.js';

storiesOf('ContextMenu', module)
  .add('ContextMenu & ContextMenuItem', () => (
    <div style={{ position: 'relative' }}>
      <ContextMenu>
        <ContextMenuItem onClick={action('clicked')}>Clickable</ContextMenuItem>
        <ContextMenuItem>Non-clickable</ContextMenuItem>
        <ContextMenuDivider />
        <ContextMenuItem>HogeHoge</ContextMenuItem>
      </ContextMenu>
    </div>
  ));
