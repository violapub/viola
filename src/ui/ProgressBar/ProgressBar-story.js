import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, number } from '@storybook/addon-knobs/react';

import { ProgressBar } from './index.js';

storiesOf('ProgressBar', module)
  .addDecorator(withKnobs)
  .add('ProgressBar', () => (
    <div style={{ width: '114px' }}>
      <ProgressBar
        value={number('value (percentage)', 70)}
        max={100}
      />
    </div>
  ));
