import React from 'react';

import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs/react';

import { Modal, ModalHeader, ModalBody, ModalFooter } from './index';

storiesOf('Modal', module)
  .addDecorator(withKnobs)
  .add('Modal', () => (
    <div style={{ position: 'relative' }}>
      <Modal show={boolean('show', false)}>
        <ModalHeader>
          <h2>Header</h2>
        </ModalHeader>
        <ModalBody>Body</ModalBody>
        <ModalFooter>Footer</ModalFooter>
      </Modal>
    </div>
  ));
