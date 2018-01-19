import React from 'react';
import classnames from 'classnames';
import './ProgressBar.css';

const ProgressBar = ({
  className, value, max,
  ...other,
}) => {
  const classes = classnames(className, 'ProgressBar');

  return (
    <div {...other} className={classes}>
      <progress className="ProgressBar_progress" value={value} max={max} />
    </div>
  );
};

export {
  ProgressBar,
};
