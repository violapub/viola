import React from 'react';
import classnames from 'classnames';
import ViolaLogoSVG from './viola_logo.svg';
import './Logo.css';

const ViolaLogo = ({
  className, black, white,
  ...other
}) => {
  const classes = classnames(className, 'ViolaLogo', {
    black: black,
    white: white,
  });

  return (
    <div {...other} className={classes}>
      <ViolaLogoSVG className="ViolaLogo_svg" />
    </div>
  );
};

export {
  ViolaLogo,
};
