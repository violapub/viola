import React from 'react';
import classnames from 'classnames';

const ProgressBar = ({
  className, value, max, ...other
}) => {
  const classes = classnames(className, 'ProgressBar');

  return (
    <div {...other} className={classes}>
      <progress value={value} max={max} />
    </div>
  );
};

export {
  ProgressBar,
};
