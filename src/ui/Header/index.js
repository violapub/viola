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
      menuOpen: false,
    });
  }

  render() {
    const {
      user, homepageURL, loginURL, signupURL,
      projectListURL, logoutURL,
    } = this.props;
    const { menuOpen, thumbnailURL } = this.state;
    const projectName = this.props.projectName || '';

    const menuKnobContent = user
      ? <div className="Header-user_avatar">
          <object data={thumbnailURL} type="image/png" />
        </div>
      : <span>未ログイン</span>

    const menuContext = user
      ? <React.Fragment>
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
          <ContextMenuItem onClick={() => {console.log('not implemented')}}>
            プロジェクトを削除
          </ContextMenuItem>
          <ContextMenuDivider />
          <ContextMenuItem href={logoutURL}>
            ログアウト
          </ContextMenuItem>
        </React.Fragment>
      : <React.Fragment>
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
        </React.Fragment>;

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
            <div className="Header-menu_knob"
              onClick={() => {
                this.setState({
                  menuOpen: !menuOpen,
                });
              }}
            >
              {menuKnobContent}
            </div>
            {menuOpen &&
              <ContextMenu alignRight black
                onClick={() => {
                  this.setState({
                    menuOpen: false,
                  });
                }}
              >
                {menuContext}
                <ContextMenuDivider />
                <ContextMenuItem>
                  <StatusIndicator />
                </ContextMenuItem>
              </ContextMenu>
            }
          </div>
        </div>
      </nav>
    );
  }
}

export {
  Header,
};
