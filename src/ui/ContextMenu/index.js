import React from 'react';
import classnames from 'classnames';
import './ContextMenu.css';

const ContextMenu = ({
  className, children,
  ...other,
}) => {
  return (
    <ul {...other} className={classnames(className, 'ContextMenu_container')}>
      {children}
    </ul>
  );
};

const ContextMenuItem = ({
  className, children, onClick,
  ...other,
}) => {
  const classes = classnames(className, 'ContextMenuItem_container', {
    'clickable': onClick
  });

  return (
    <li {...other} className={classes} onClick={onClick}>
      {children}
    </li>
  );
};

const ContextMenuDivider = ({
  ...other,
}) => {
  return (
    <li {...other}>
      <hr className="ContextMenuDivider_divider" />
    </li>
  )
};

export {
  ContextMenu,
  ContextMenuItem,
  ContextMenuDivider,
};
