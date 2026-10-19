/**
 * [INPUT]: 依赖冻结 project-link bridge、四语文案回调与外围 Toast 能力。
 * [OUTPUT]: 对外提供创建固定 ID 外链回调的 `createProjectLinkControl`；失败只显示外围 Toast。
 * [POS]: renderer 的无 DOM 外链适配器；复用主窗、footer 与 About 的同一导航/失败边界，不接收 URL。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
(function attachProjectLinkControl(global) {
  'use strict';

  function createProjectLinkControl({ api, text, toast }) {
    return async function openProjectLink(link) {
      try {
        const result = await api.openProjectLink(link);
        if (result?.ok) return;
      } catch (_) {
        // 外链失败只通过稳定文案显示外围 Toast。
      }
      toast.show({
        type: 'error',
        title: text('projectLinkFailedTitle'),
        description: text('openProjectLinkFailed'),
      });
    };
  }

  global.createProjectLinkControl = createProjectLinkControl;
})(window);
