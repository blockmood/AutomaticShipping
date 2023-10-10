import React from 'react';
import { contentClient } from '../../chrome';
import DrawerDemo from './components/Drawer/DrawerDemo';
import { render } from 'react-dom';
import cookie from 'cookiejs';
import { message } from 'antd';

export default class ContentScripts {
  constructor() {
    this.container = null;
    this.init();
  }
  init() {
    // 注意，必须设置了run_at=document_start 此段代码才会生效
    document.addEventListener('DOMContentLoaded', () => {
      this.initContainer();
      this.initMessageClient();
      this.initButton();
    });
  }

  initButton() {
    const div = document.createElement('div');
    div.style.width = '69px';
    div.style.height = '50px';
    div.style.background = 'red';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = 999;
    div.style.borderRadius = '10px';
    document.body.appendChild(div);

    div.addEventListener('click', () => {
      if (!cookie.get('token')) {
        message.error('先登录');
        return;
      }

      window.postMessage({ key: 'showDrawer' }, '*');
    });
  }

  initContainer() {
    const { document } = window;
    const base = document.querySelector(
      '#chrome-extension-content-base-elemen'
    );
    if (base) {
      this.container = base;
    } else {
      this.container = document.createElement('div');
      this.container.setAttribute(
        'id',
        'chrome-extension-content-base-element'
      );
      this.container.setAttribute(
        'class',
        'chrome-extension-content-base-element'
      );

      document.body.appendChild(this.container);
    }
  }

  initMessageClient() {
    const { container } = this;

    render(
      <DrawerDemo
        handleClose={() => {
          this.hideContainer();
        }}
      />,
      container
    );
  }

  showContainer() {
    this.container.setAttribute('style', 'display: block');
  }

  hideContainer() {
    this.container.setAttribute('style', 'display: none');
  }
}
