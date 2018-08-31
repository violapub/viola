import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import StorybookContainer from './StorybookContainer';

addDecorator(story => <StorybookContainer story={story} />);

function loadStories() {
  const components = require.context('../src/components', true, /\-story\.js$/);
  components.keys().forEach(filename => components(filename));

  const ui = require.context('../src/ui', true, /\-story\.js$/);
  ui.keys().forEach(filename => ui(filename));
}

configure(loadStories, module);
