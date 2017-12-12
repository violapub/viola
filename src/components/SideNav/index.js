import React from 'react';
import classnames from 'classnames';
import './SideNav.css';

const { REACT_APP_VERSION, REACT_APP_VIOLA_REPOSITORY } = process.env;

export default class SideNav extends React.Component {

  props: {
    bramble: any,
  };

  initBramble = (bramble) => {
    bramble.on('layout', this.updateLayout);
  }

  updateLayout = (data) => {
    if (this.sideNavElement) {
      this.sideNavElement.style.width = `${data.sidebarWidth}px`;
    }
  };

  componentWillMount() {
    this.initBramble(this.props.bramble);
  }

  render() {
    return (
      <nav className={classnames('SideNav')}
        ref={it => this.sideNavElement = it}
      >
        <div className="SideNav-item">{'v' + REACT_APP_VERSION}</div>
        <a className="SideNav-item" href={REACT_APP_VIOLA_REPOSITORY} target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </nav>
    );
  }
}
