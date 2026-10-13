<!--
[INPUT]: 依赖 renderer 实际适配的 shadcn/ui、Base UI、Phosphor MIT 源码及 Simple Icons CC0 GitHub/小红书 SVG。
[OUTPUT]: 对外提供 renderer 内组件行为与 SVG path 的来源、锁定版本、许可证和版权通知。
[POS]: renderer 的第三方归因边界；只记录进入本地源码的材料，不引入运行时依赖。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# Renderer third-party notices

The renderer contains adapted component behavior and selected SVG data from the projects below.

## shadcn/ui

Copyright (c) 2023 shadcn

Source: https://github.com/shadcn-ui/ui

Adapted renderer behavior is reviewed against upstream commit
`683a5a9b370acdb7785a0529434e6a3b8c7e0441` and the `shadcn` 4.19.0
`tailwind.css` Button, Marker, shimmer, and scroll-fade sources/utilities.

Licensed under the MIT License. The full license text is available at:
https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

## Base UI

Copyright (c) 2019 Material-UI SAS

Source: https://github.com/mui/base-ui

Toast timing, limit, pause/resume, focus, and live-region behavior is adapted
from `@base-ui/react` 1.6.0.

Licensed under the MIT License. The full license text is available at:
https://github.com/mui/base-ui/blob/v1.6.0/LICENSE

## Phosphor Icons

Copyright (c) 2023 Phosphor Icons

Source: https://github.com/phosphor-icons/core

Selected Regular SVG paths are adapted into the local semantic icon registry,
including ArrowCircleUp for updates, the Cavalry launch Play glyph, and the
Windows caption Info, Minus, Square, Copy, and X glyphs.

The About Twitter/X row uses the Phosphor Regular `x-logo.svg` asset from
upstream commit `2b75f3ad12b420c9504ef05df8d2564a28f8500e`:
https://github.com/phosphor-icons/core/blob/2b75f3ad12b420c9504ef05df8d2564a28f8500e/assets/regular/x-logo.svg

Licensed under the MIT License. The full license text is available at:
https://github.com/phosphor-icons/core/blob/main/LICENSE

## Simple Icons

About and the main support footer share the `github.svg` and
`xiaohongshu.svg` icons from the `simple-icons/simple-icons` repository at commit
`4d29a35c954699b389a834aacc97dd6e7e74143c`:
https://github.com/simple-icons/simple-icons/blob/4d29a35c954699b389a834aacc97dd6e7e74143c/icons/github.svg
https://github.com/simple-icons/simple-icons/blob/4d29a35c954699b389a834aacc97dd6e7e74143c/icons/xiaohongshu.svg

The icon is available under CC0 1.0 Universal. The license is available at:
https://github.com/simple-icons/simple-icons/blob/4d29a35c954699b389a834aacc97dd6e7e74143c/LICENSE.md

CC0 does not grant trademark rights. The asset does not change the brand owner's rights.

Both marks use the pinned upstream paths. Xiaohongshu keeps the source path;
its viewBox is cropped to the mark bounds and its width uses twice the shared
icon size for legibility. About and the support footer consume one registry.

Brand color `#FF2442` is taken from the Simple Icons Xiaohongshu entry
(https://simpleicons.org/?q=xiaohongshu). It applies only to the decorative mark.
