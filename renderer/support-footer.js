/**
 * [INPUT]: 依赖主窗固定 footer DOM、共享 SVG 图标、四语 UI_TEXT 与固定项目外链回调。
 * [OUTPUT]: 对外提供支持文案的四语同步、GitHub/X/小红书图标装配及固定 ID 点击分发。
 * [POS]: 主窗口独立 footer 控制器；只把已知链接 ID 交给 app.js，不接受或拼接 URL。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
(function attachSupportFooter(global) {
  'use strict';

  const LINKS = Object.freeze([
    { element: 'github', icon: 'githubLogo', target: 'repository', label: 'supportFooterGithubAria' },
    { element: 'twitter', icon: 'xLogo', target: 'twitter', label: 'supportFooterTwitterAria' },
    { element: 'xiaohongshu', icon: 'xiaohongshuLogo', target: 'xiaohongshu', label: 'supportFooterXiaohongshuAria' },
  ]);

  function createSupportFooterControl({ message, nav, links, icons, text, openProjectLink }) {
    for (const entry of LINKS) {
      const link = links[entry.element];
      links[`${entry.element}Icon`].append(icons.create(entry.icon));
      link.addEventListener('click', (event) => {
        event.preventDefault();
        void openProjectLink(entry.target);
      });
    }

    function localize() {
      message.textContent = text('supportFooterMessage');
      nav.setAttribute('aria-label', text('supportFooterLinksAria'));
      for (const entry of LINKS) {
        links[entry.element].setAttribute('aria-label', text(entry.label));
      }
    }

    localize();
    return Object.freeze({ localize });
  }

  global.createSupportFooterControl = createSupportFooterControl;
})(window);
