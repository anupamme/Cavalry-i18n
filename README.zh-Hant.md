<!--
[INPUT]: 依赖 GitHub 最新正式 Release、当前发布配置、平台运行时边界与 LOCAL_BUILD_SOP
[OUTPUT]: 提供 Cavalry 2.8.0 使用者設定語言切換與歸屬還原、2.7.2 p12 歷史連結、平台權限及翻譯邊界
[POS]: 倉庫繁體中文使用者入口；與英文及其他本地化 README 同步發布真相，不替代平台真機驗收
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

<div align="center">
  <img src="./src-tauri/icons/icon.png" width="120" />
  <h1>Cavalry-i18n</h1>
  <p>直接在 macOS 或 Windows 原始應用程式中，將 <a href="https://cavalry.scenegroup.co/">Cavalry</a> 2.8.0 切換為 English、簡體中文、繁體中文或日本語。</p>
  <a href="https://github.com/daftAI2026/Cavalry-i18n/stargazers"><img src="https://img.shields.io/github/stars/daftAI2026/Cavalry-i18n?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/daftAI2026/Cavalry-i18n/releases/latest"><img src="https://img.shields.io/github/v/release/daftAI2026/Cavalry-i18n?sort=date&display_name=tag&style=flat-square" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>

  <p>Languages: <a href="README.md">English</a> | <a href="README.zh-Hans.md">简体中文</a> | 繁體中文 | <a href="README.ja_JP.md">日本語</a></p>
</div>

Cavalry 2.7.2 使用者請使用歷史版本 [p12 Release](https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12)。

## 預覽

![Cavalry UI 繁體中文](docs/img/ui-zh-Hant.png)

## 功能

- **一步切換語言**：結束 Cavalry，選擇語言並點選 **「切換」**；完成後 Cavalry 會自動開啟。
- **四種介面語言**：English、简体中文、繁體中文和日本語。
- **雙平台支援**：適用於 macOS 與 Windows x64 上的 Cavalry 2.8.0。
- **原生使用者設定語言包**：透過目前使用者的 Cavalry 設定寫入 2.8 原生介面文字。
- **歸屬還原**：只還原語言切換器能證明由自己寫入的設定和執行階段內容。
- **自動尋找與還原**：尋找常見安裝位置、顯示目前語言，並記錄支援還原所需狀態。
- **應用程式內更新**：發現後續 Switcher 版本時提醒使用者，並在安裝前完成驗證。

## Switcher 視窗

選擇目標語言，再點選 **「切換」** 或 **「還原英文」**。目前語言旁出現更新徽章時，可以選取它並點選 **「更新」**，重新套用該語言的最新資源，無須先切換其他語言或還原英文。只有資源已是最新時，目前語言才無法重複選取。操作進度和復原指引顯示在按鈕下方。

2.8 語言包會將原生介面文字和語言設定寫入目前使用者的 Cavalry 設定。它不使用歷史 2.7 JSON 資源覆蓋。macOS 需要變更原生執行階段時，會先驗證 Cavalry 目標和官方基線。基線缺失或無效時，執行階段寫入會停止。

**「還原英文」** 會還原已保存的使用者設定文字，並將語言設為英文。語言切換器擁有執行階段內容時，會透過平台驗證的還原交易復原。使用者在切換後修改設定時，操作會停止並保留這些修改。

## 安全與權限

Cavalry Language Switcher 是獨立社群工具，不隸屬於 Scene Group、Cavalry 或 Canva。

語言切換器會修改本機 Cavalry 安裝。如果版本不受支援、無法驗證安裝或寫入遭拒，新語言不會生效。

在 macOS 上，它會先直接嘗試切換。只有系統實際拒絕寫入後，才會開啟 **「系統設定 → 隱私權與安全性 → App Management」**。僅在信任目前構建時授權；macOS 可能要求重新開啟語言切換器後再試。修改後的 `Cavalry.app` 會在本機重新簽名，以便正常啟動。

在 Windows 上，目前使用者可寫入的自訂目錄會直接處理。UAC 提權僅用於系統 Program Files 目錄中的 Cavalry 安裝。不明 DLL 不會被刪除或替換。

**「還原英文」** 只還原已記錄的使用者設定文字和語言切換器擁有的執行階段。若所需執行階段基線缺失或無法驗證，操作會在寫入 app bundle 前停止。它不會重新安裝 Cavalry。

## 從 Release 安裝

從 [GitHub Releases](https://github.com/daftAI2026/Cavalry-i18n/releases/latest) 下載對應安裝程式：Apple M DMG、Intel DMG 或 Windows x64 NSIS。

macOS 版本使用 ad-hoc 簽名，尚未經過 Apple 公證。將應用程式拖入「應用程式」後，如果 macOS 阻止首次開啟，請執行：

```bash
xattr -dr com.apple.quarantine "/Applications/Cavalry Language Switcher.app"
codesign --force --deep --sign - "/Applications/Cavalry Language Switcher.app"
open "/Applications/Cavalry Language Switcher.app"
```

應用程式內更新會安裝新的 app bundle，因此 macOS 可能要求再次執行這些步驟。Windows 安裝程式尚未進行 Authenticode 簽名，可能顯示「未知發行者」；請確認檔案來自本專案的 GitHub Release。

原始碼構建請遵循 [LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md)。

## 快速開始

```bash
npm install
npm run tauri:dev              # 從原始碼執行
npm run build:tauri            # 構建 macOS DMG
npm run build:tauri:windows    # 在 Windows 上構建 NSIS
```

請使用儲存庫固定的 Node、Rust、Qt、Python 與 Windows CMake 工具鏈。平台相依項目和打包檢查以 [LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md) 為準。

## 工作原理

1. 驗證所選 Cavalry 2.8.0 安裝和內嵌原生資源清單。
2. 載入由固定 Cavalry 2.8 目錄建置的已核准語言包。
3. 將語言設定和 `strings.json` 包寫入目前使用者的 Cavalry 設定。
4. 需要變更執行階段時，呼叫經驗證的平台原生執行階段交易。
5. 語言交易提交後開啟 Cavalry。

**「還原英文」** 會還原已保存的使用者設定文字、將語言設為英文，並還原語言切換器擁有的執行階段。若使用者在切換後修改設定，交易會停止，不會覆蓋修改。

## 支援語言

| 語言 | 代碼 |
|----------|------|
| English | `en` |
| 簡體中文 | `zh-Hans` |
| 繁體中文 | `zh-Hant` |
| 日本語 | `ja_JP` |

## 開發

```bash
npm run test:contracts         # Renderer、bridge、發布與打包合同
npm run test:tauri             # Rust 測試
npm run check:app              # JavaScript 語法
```

2.8.0 生產建置使用 Qt 6.9.2。發布套件不得依賴浮動工具版本；請遵循 [LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md)。

## AI / Agent Guide

修改程式碼前，請閱讀 [AGENTS.md](AGENTS.md)、[CLAUDE.md](CLAUDE.md) 和目標模組最近的 `CLAUDE.md`。這些檔案定義架構地圖、職責邊界、命令和文件協定。

## 翻譯面

2.8.0 原生使用者設定包使用 `languages/native/` 中綁定原文的核准譯文，並讀取固定於 `tools/cavalry_native_target.json` 的官方目錄。`tools/native_resource_bundle.js` 會驗證並建置三種目標語言包。請勿手動修改生成包。

建置器預設保留官方 `dontTranslate` 項目。顯示例外只涵蓋 100 個身分與譯值均已核對的內建示例選單標籤。它不會修改預設集路徑、模型名稱、選單動作或使用者輸入文字。

`languages/` 中的 JSON 覆蓋包和 `tools/*.ts` 注入器譯文屬於獨立的歷史或執行階段路徑，不是 Cavalry 2.8 原生使用者設定包的來源。生成的注入器表也不得手動修改。翻譯規則和實機驗證流程見 [docs/translation-guidelines.md](docs/translation-guidelines.md) 與 [docs/runtime-ui-live-capture-workflow.md](docs/runtime-ui-live-capture-workflow.md)。

## 倉庫結構

```text
Cavalry-i18n/
├── renderer/          # Tauri WebView 介面
├── src-tauri/         # Rust 命令與平台作業
├── injector/          # macOS 與 Windows Qt 執行階段翻譯器
├── languages/         # 歷史 JSON 包與 2.8 原生核准譯文
├── tools/             # 構建、驗證與發布工具
├── docs/              # 公開規則、可重複 SOP 與圖片
└── .github/workflows/ # CI、平台打包與 Release 發布
```

## CI/CD

| Job | 職責 |
| --- | --- |
| `build` | 語法、合同與翻譯驗證 |
| `windows_check` | Windows 翻譯器、Rust、NSIS 生命週期與更新包 |
| `package_macos` | Apple Silicon 與 Intel Tauri 打包及產物檢查 |
| `release` | 為 `cavalry-*-p*` tag 發布簽名更新清單與七項精確回讀資產 |

## 支援

- 如果 Cavalry-i18n 幫到了你，可以把它[分享](https://twitter.com/intent/tweet?url=https://github.com/daftAI2026/Cavalry-i18n&text=Cavalry-i18n%20-%20Switch%20Cavalry%E2%80%99s%20UI%20between%20English,%20Chinese,%20and%20Japanese%20with%20one%20click.)給朋友，或點一個 star。
- 遇到 bug？請使用[問題回報範本](https://github.com/daftAI2026/Cavalry-i18n/issues/new?template=bug_report.yml)。想法或程式碼貢獻也歡迎提交 Issue 或 PR。

## 授權

MIT License。歡迎使用 Cavalry-i18n 並參與貢獻。
