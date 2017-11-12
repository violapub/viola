import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { IconButton, SelectiveRippleButton, SelectiveRippleButtonItem } from './index.js';

storiesOf('Button', module)
  .add('IconButton', () => (
    <div>
      <IconButton name="upload" onClick={action('clicked')} />
      <IconButton name="plus" onClick={action('clicked')} />
      <IconButton name="folder" onClick={action('clicked')} />
    </div>
  ))
  .add('SelectiveRippleButton', () => (
    <SelectiveRippleButton
      data={[
        { name: 'mobile' },
        { name: 'desktop' },
        { name: 'print' },
      ]}
      initialActive={0}
      onChange={action('clicked')}
    />
  ));
