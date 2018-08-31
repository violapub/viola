import React from 'react';
import { CSSTransition } from 'react-transition-group';
import classnames from 'classnames';
import './Modal.css';

const ModalHeader = ({ className, children, ...other }) => (
  <div {...other} className={classnames(className, 'ModalHeader')}>
    {children}
  </div>
);

const ModalBody = ({ className, children, ...other }) => (
  <div {...other} className={classnames(className, 'ModalBody')}>
    {children}
  </div>
);

const ModalFooter = ({ className, children, ...other }) => (
  <div {...other} className={classnames(className, 'ModalFooter')}>
    {children}
  </div>
);

class Modal extends React.PureComponent {
  render() {
    const { show, className, children, ...other } = this.props;

    return (
      <CSSTransition timeout={200} in={this.props.show}
        classNames="modalanim" unmountOnExit
      >
        {state => (
          <div {...other} className={classnames(className, 'Modal')}>
            <div className="Modal_underlay"></div>
            <div className="Modal_container">
              <div className="Modal_content">
                {children}
              </div>
            </div>
          </div>
        )}
      </CSSTransition>
    );
  }
}

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
};
