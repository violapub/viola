import React from 'react';
import classnames from 'classnames';
import gravatar from 'gravatar';

import { ContextMenu, ContextMenuItem, ContextMenuDivider } from './../ContextMenu';
import { ViolaLogo } from './../Logo';
import { StatusIndicator } from './../StatusIndicator';
import './Header.css';

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
              <object data={thumbnailURL} type="image/png" />
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
                プロジェクト一覧
              </ContextMenuItem>
              {/* <ContextMenuItem onClick={() => {console.log('not implemented')}}>
                プロジェクトを削除
              </ContextMenuItem> */}
              <ContextMenuDivider />
              <ContextMenuItem href={logoutURL}>
                ログアウト
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
            <span>未ログイン</span>
          </div>
          {menuOpen &&
            <ContextMenu alignRight black onClick={() => this.toggleMenuOpen(false)}>
              <ContextMenuItem href={loginURL}>
                <div className="Header-context_label">
                  アカウントをお持ちの場合
                </div>
                ログイン
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem href={signupURL}>
                <div className="Header-context_label">
                  アカウント登録で、プロジェクトのバックアップを作成できます。
                </div>
                アカウント作成
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
          <span>サーバー未接続</span>
        </div>
        {menuOpen &&
          <ContextMenu alignRight black onClick={() => this.toggleMenuOpen(false)}>
            <ContextMenuItem>
              <div className="Header-context_label">
                Violaサーバーとの接続に失敗したため、編集内容は同期されません。
                接続状況を確認して、後ほど再読込してください。
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
