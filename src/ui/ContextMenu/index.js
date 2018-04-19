import React from 'react';
import classnames from 'classnames';
import './ContextMenu.css';
import { outOfRange } from 'glamor';

const ContextMenu = ({
  className, children, onOverlayClick, alignRight, black,
  ...other,
}) => {
  const classes = classnames(className, 'ContextMenu_container', {
    'align-right': alignRight,
    black,
  });
  return (
    <div {...other} className={classes}>
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
  className, children, onClick, href,
  ...other,
}) => {
  const classes = classnames(className, 'ContextMenuItem_container', {
    'clickable': onClick || href,
  });

  const content = (
    <li {...other} className={classes} onClick={onClick}>
      {children}
    </li>
  );
  return href
    ? <a href={href}>{content}</a>
    : content;
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
