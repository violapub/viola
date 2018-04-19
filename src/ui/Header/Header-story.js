import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, text } from '@storybook/addon-knobs/react';

import { Header } from './index';

storiesOf('Header', module)
  .addDecorator(withKnobs)
  .add('Header', () => {
    const loggedIn = boolean('logged in', true);
    const projectName = text('projectName', 'Untitled Project');
    const homepageURL = text('homepageURL', 'http://example.com/homepage');
    const loginURL = text('loginURL', 'http://example.com/login');
    const signupURL = text('signupURL', 'http://example.com/signup');
    const projectListURL = text('homepageURL', 'http://example.com/projectList');
    const logoutURL = text('signupURL', 'http://example.com/logout');
    const user = {
      id: text('user.id', 'testtesttest'),
      name: text('user.name', 'foo'),
      email: text('user.email', 'foo@example.com'),
    };
    return (
      <div style={{ width: '100%' }}>
        <Header user={loggedIn && user}
          {...{ projectName, homepageURL, loginURL, signupURL, projectListURL, logoutURL }}
        />
      </div>
    )
  })
