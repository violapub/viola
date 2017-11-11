import React from 'react';
import classnames from 'classnames';
import './ContextMenu.css';

const ContextMenu = ({
  className, children, onOverlayClick,
  ...other,
}) => {
  return (
    <div {...other} className={classnames(className, 'ContextMenu_container')}>
      <ul className="ContextMenu_ul"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {children}
      </ul>
      <div className="ContextMenu_underlay" onClick={onOverlayClick}></div>
    </div>
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
