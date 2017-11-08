import React from 'react';
import {Icon} from 'react-fa';
import classnames from 'classnames';
import './Button.css';

const IconButton = ({
  className, name,
  ...other
}) => {
  const buttonClasses = classnames(className, 'IconButton_button');

  return (
    <button {...other} className={buttonClasses}>
      <Icon name={name} />
    </button>
  );
};

export {
  IconButton,
};
