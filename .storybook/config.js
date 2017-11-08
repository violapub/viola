import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import StorybookContainer from './StorybookContainer';

addDecorator(story => <StorybookContainer story={story} />);

function loadStories() {
  const req = require.context('../src/ui', true, /\-story\.js$/);
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
