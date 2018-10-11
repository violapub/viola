import React from 'react';
import gravatar from 'gravatar';
import { defineMessages, FormattedMessage } from 'react-intl';
import noun from '../../misc/noun';
import { ContextMenu, ContextMenuItem, ContextMenuDivider } from './../ContextMenu';
import { ViolaLogo } from './../Logo';
import { StatusIndicator } from './../StatusIndicator';
import './Header.css';

const messages = defineMessages({
  notLoggedIn: 'Not logged in',
  loginInstruction: 'If you have the account…',
  signUpInstruction: 'You can make backups of your project by signing up.',
  notConnected: 'Not connected',
  connectionFailed: 'Editing content won\'t be synchronized because a connection to Viola server has failed. Please check your connection status and reload it later.',
});

class Header extends React.PureComponent {
  props: {
    user: any,
    projectName: string,
    homepageURL: string,
    loginURL: string,
    signupURL: string,
    projectListURL: string,
    logoutURL: string,
    menuStatus: 'LOADING' | 'LOADED' | 'DISCONNECTED',
  };

  state = {
    thumbnailURL: null,
    menuOpen: false,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const thumbnailURL = nextProps.user
      && gravatar.url(nextProps.user.email, {protocol: 'https', s: '48', d: 'identicon'});

    return Object.assign(prevState, {
      thumbnailURL,
    });
  }

  toggleMenuOpen = (menuOpen = null) => {
    this.setState({
      menuOpen: (menuOpen !== null)? menuOpen : !this.state.menuOpen,
    });
  };

  render() {
    const { homepageURL, menuStatus } = this.props;

    return (
      <nav className="Header">
        <div className="Header-title">
          <a href={homepageURL}>
            <ViolaLogo white className="Header-title-logo" />
          </a>
        </div>
        <div className="Header-lr">
          <div className="Header-left">
          </div>
          <div className="Header-right">
            {menuStatus === 'LOADING' ? this._renderLoadingMenu()
              : menuStatus === 'LOADED' ? this._renderLoadedMenu()
              : menuStatus === 'DISCONNECTED' ? this._renderDisconnectedMenu()
              : null
            }
          </div>
        </div>
      </nav>
    );
  }

  _renderLoadingMenu = () => {
    return null;
  };

  _renderLoadedMenu = () => {
    const { user, loginURL, signupURL, projectListURL, logoutURL } = this.props;
    const { menuOpen, thumbnailURL } = this.state;
    const projectName = this.props.projectName || '';

    if (user) {
      return (
        <React.Fragment>
          <div className="Header-menu_knob" onClick={() => this.toggleMenuOpen()}>
            <div className="Header-user_avatar">
              <object data={thumbnailURL} title="avatar" type="image/png" />
            </div>
          </div>
          {menuOpen &&
            <ContextMenu alignRight black onClick={() => this.toggleMenuOpen(false)}>
              <ContextMenuItem>
                <div className="Header-context_label">
                  {user.name}
                </div>
                {projectName}
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem href={projectListURL}>
                <FormattedMessage {...noun.projectList} />
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem href={logoutURL}>
                <FormattedMessage {...noun.logout} />
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem>
                <StatusIndicator />
              </ContextMenuItem>
            </ContextMenu>
          }
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <div className="Header-menu_knob" onClick={this.toggleMenuOpen}>
            <span><FormattedMessage {...messages.notLoggedIn}/></span>
          </div>
          {menuOpen &&
            <ContextMenu alignRight black onClick={() => this.toggleMenuOpen(false)}>
              <ContextMenuItem href={loginURL}>
                <div className="Header-context_label">
                  <FormattedMessage {...messages.loginInstruction} />
                </div>
                <FormattedMessage {...noun.login} />
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem href={signupURL}>
                <div className="Header-context_label">
                  <FormattedMessage {...messages.signUpInstruction} />
                </div>
                <FormattedMessage {...noun.signUp} />
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem>
                <StatusIndicator />
              </ContextMenuItem>
            </ContextMenu>
          }
        </React.Fragment>
      );
    }
  };

  _renderDisconnectedMenu = () => {
    const { menuOpen } = this.state;
    return (
      <React.Fragment>
        <div className="Header-menu_knob" onClick={this.toggleMenuOpen}>
          <span><FormattedMessage {...messages.notConnected} /></span>
        </div>
        {menuOpen &&
          <ContextMenu alignRight black onClick={() => this.toggleMenuOpen(false)}>
            <ContextMenuItem>
              <div className="Header-context_label">
                <FormattedMessage {...messages.connectionFailed} />
              </div>
            </ContextMenuItem>
          </ContextMenu>
        }
      </React.Fragment>
    );
  };
}

export {
  Header,
};
