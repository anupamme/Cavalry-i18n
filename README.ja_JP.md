<!--
[INPUT]: 依赖 GitHub 最新正式 Release、当前发布配置、平台运行时边界与 LOCAL_BUILD_SOP
[OUTPUT]: Cavalry 2.8.0 のユーザープロファイル言語切り替えと所有状態の復元、2.7.2 p12 の履歴リンク、権限と翻訳境界を伝える日本語版
[POS]: リポジトリの日本語ユーザー入口。英語と他のローカライズ README に公開の事実を同期し、実機検証の代替にはしない
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

<div align="center">
  <img src="./src-tauri/icons/icon.png" width="120" />
  <h1>Cavalry-i18n</h1>
  <p>macOS または Windows の元のアプリのまま、<a href="https://cavalry.scenegroup.co/">Cavalry</a> 2.8.0 を English、简体中文、繁體中文、日本語に切り替えます。</p>
  <a href="https://github.com/daftAI2026/Cavalry-i18n/stargazers"><img src="https://img.shields.io/github/stars/daftAI2026/Cavalry-i18n?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/daftAI2026/Cavalry-i18n/releases/latest"><img src="https://img.shields.io/github/v/release/daftAI2026/Cavalry-i18n?sort=date&display_name=tag&style=flat-square" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>

  <p>Languages: <a href="README.md">English</a> | <a href="README.zh-Hans.md">简体中文</a> | <a href="README.zh-Hant.md">繁體中文</a> | 日本語</p>
</div>

Cavalry 2.7.2 では、過去の [p12 Release](https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12) を使用してください。

## プレビュー

![Cavalry UI 日本語](docs/img/ui-ja_JP.png)

## 機能

- **1 ステップの言語切り替え**：Cavalry を終了し、言語を選んで **「切り替える」** を選択します。完了すると Cavalry が自動で開きます。
- **4 つの UI 言語**：English、简体中文、繁體中文、日本語。
- **2 つのプラットフォーム**：macOS と Windows x64 上の Cavalry 2.8.0。
- **ネイティブのユーザープロファイル言語パック**：Cavalry 2.8 のネイティブ UI テキストを現在のユーザープロファイルに適用します。
- **所有状態の復元**：Switcher が所有を証明できるプロファイルとランタイムの変更だけを復元します。
- **自動検出と復旧**：一般的なインストール先を検出し、現在の言語を表示して、復元に必要な状態を記録します。
- **アプリ内更新**：新しい Switcher バージョンを通知し、インストール前に検証します。

## Switcher ウィンドウ

切り替え先の言語を選び、**「切り替える」** または **「英語に戻す」** を選択します。現在の言語に更新バッジが表示されたら、その言語を選んで **「更新」** を押すと、最新の言語リソースを再適用できます。別の言語への切り替えや英語への復元は不要です。現在の言語を再選択できないのは、リソースが最新の場合だけです。進行状況と復旧案内はボタンの下に表示されます。

2.8 の言語パックは、ネイティブ UI テキストと言語設定を現在のユーザーの Cavalry プロファイルに書き込みます。過去の 2.7 JSON アセット上書きは使用しません。macOS でネイティブランタイムを変更する場合は、Cavalry の対象と公式ベースラインを検証します。ベースラインがない、または無効な場合、ランタイムへの書き込みを停止します。

**「英語に戻す」** は保存済みのプロファイル文字列を復元し、言語を英語に設定します。Switcher が所有するランタイムがある場合は、プラットフォームの検証済み復元トランザクションを実行します。Switcher の書き込み後にユーザーがプロファイルを変更した場合は、処理を停止して変更を保持します。

## 安全性と権限

Cavalry Language Switcher は独立したコミュニティツールであり、Scene Group、Cavalry、Canva とは提携していません。

Switcher はローカルの Cavalry インストールを変更します。バージョンが未対応、インストールを検証できない、または書き込みが拒否された場合、新しい言語は適用されません。

macOS では、まず切り替えを直接試します。macOS が実際に書き込みを拒否した場合にだけ、**システム設定 → プライバシーとセキュリティ → App Management** を開きます。このビルドを信頼できる場合にのみ許可してください。再試行前に Switcher を開き直すよう求められる場合があります。変更された `Cavalry.app` は、起動できるようローカルで再署名されます。

Windows では、現在のユーザーが書き込めるカスタムインストール先を直接処理します。UAC 昇格はシステムの Program Files 配下にある Cavalry だけに限定されます。不明な DLL は削除も置換もしません。

**「英語に戻す」** は記録済みのプロファイル文字列と Switcher が所有するランタイムだけを復元します。必要なランタイムベースラインがない、または検証できない場合は、app bundle への書き込み前に停止します。Cavalry を再インストールする機能ではありません。

## Release からインストール

[GitHub Releases](https://github.com/daftAI2026/Cavalry-i18n/releases/latest) から、Apple M DMG、Intel DMG、Windows x64 NSIS のいずれかをダウンロードします。

macOS 版は ad-hoc 署名で、Apple の公証は受けていません。アプリケーションへドラッグした後、macOS が初回起動をブロックした場合は次を実行します。

```bash
xattr -dr com.apple.quarantine "/Applications/Cavalry Language Switcher.app"
codesign --force --deep --sign - "/Applications/Cavalry Language Switcher.app"
open "/Applications/Cavalry Language Switcher.app"
```

アプリ内更新では新しい app bundle がインストールされるため、同じ手順が再度必要になる場合があります。Windows インストーラーは Authenticode 署名されておらず、「不明な発行元」と表示される場合があります。本プロジェクトの GitHub Release から取得したファイルであることを確認してください。

ソースビルドは [LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md) に従います。

## クイックスタート

```bash
npm install
npm run tauri:dev              # ソースから実行
npm run build:tauri            # macOS DMG をビルド
npm run build:tauri:windows    # Windows 上で NSIS をビルド
```

リポジトリで固定された Node、Rust、Qt、Python、Windows CMake ツールチェーンを使用してください。プラットフォーム要件とパッケージ検証は [LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md) が正本です。

## 仕組み

1. 選択した Cavalry 2.8.0 と組み込みリソースマニフェストを検証します。
2. 固定された Cavalry 2.8 カタログから構築した承認済み言語パックを読み込みます。
3. 言語設定と `strings.json` パックを現在のユーザープロファイルに適用します。
4. ランタイム変更が必要な場合は、検証済みのプラットフォーム別トランザクションを実行します。
5. 言語トランザクションの確定後に Cavalry を開きます。

**「英語に戻す」** は保存したプロファイル文字列を復元して言語を英語に設定し、Switcher が所有するランタイムを復元します。プロファイルが変更されている場合は、上書きせずに処理を停止します。

## 対応言語

| 言語 | コード |
|----------|------|
| English | `en` |
| 简体中文 | `zh-Hans` |
| 繁體中文 | `zh-Hant` |
| 日本語 | `ja_JP` |

## 開発

```bash
npm run test:contracts         # Renderer、bridge、Release、パッケージの契約
npm run test:tauri             # Rust テスト
npm run check:app              # JavaScript 構文
```

2.8.0 の本番ビルドは Qt 6.9.2 を使用します。Release パッケージでは固定ツールバージョンを使用し、[LOCAL_BUILD_SOP.md](LOCAL_BUILD_SOP.md) に従ってください。

## AI / Agent Guide

コードを変更する前に、[AGENTS.md](AGENTS.md)、[CLAUDE.md](CLAUDE.md)、対象モジュールに最も近い `CLAUDE.md` を確認してください。これらはアーキテクチャ、責務境界、コマンド、ドキュメント規約を定義します。

## 翻訳サーフェス

2.8.0 のネイティブユーザープロファイルパックは、`languages/native/` の原文に紐づく承認済み訳文と、`tools/cavalry_native_target.json` に固定された公式カタログを使用します。`tools/native_resource_bundle.js` が 3 言語のパックを検証して構築します。生成パックは手動編集しないでください。

ビルダーは公式の `dontTranslate` 項目を標準で維持します。表示の例外は、ID と値を検証した 100 個の組み込みデモメニュー名だけです。プリセットのパス、モデル名、メニュー操作、ユーザー入力テキストは変更しません。

`languages/` の JSON 上書きと `tools/*.ts` injector 訳文は、別の過去またはランタイム経路です。Cavalry 2.8 のネイティブユーザープロファイルパックの翻訳元ではありません。生成された injector テーブルも手動編集しないでください。翻訳規則と実機検証は [docs/translation-guidelines.md](docs/translation-guidelines.md) と [docs/runtime-ui-live-capture-workflow.md](docs/runtime-ui-live-capture-workflow.md) を参照してください。

## リポジトリ

```text
Cavalry-i18n/
├── renderer/          # Tauri WebView UI
├── src-tauri/         # Rust コマンドとプラットフォーム処理
├── injector/          # macOS / Windows Qt ランタイム翻訳
├── languages/         # 過去の JSON パックと 2.8 の承認済みネイティブ翻訳
├── tools/             # ビルド、検証、Release ツール
├── docs/              # 公開規則、再現可能な SOP、画像
└── .github/workflows/ # CI、プラットフォーム別パッケージ、Release 公開
```

## CI/CD

| Job | 役割 |
| --- | --- |
| `build` | 構文、契約、翻訳の検証 |
| `windows_check` | Windows 翻訳、Rust、NSIS ライフサイクル、更新パッケージ |
| `package_macos` | Apple Silicon / Intel Tauri パッケージと成果物検証 |
| `release` | `cavalry-*-p*` tag に対する署名付き更新マニフェストと 7 個の公開成果物 |

## サポート

- Cavalry-i18n が役に立ったら、友人に[共有](https://twitter.com/intent/tweet?url=https://github.com/daftAI2026/Cavalry-i18n&text=Cavalry-i18n%20-%20Switch%20Cavalry%E2%80%99s%20UI%20between%20English,%20Chinese,%20and%20Japanese%20with%20one%20click.)するか star を付けてください。
- 不具合は[報告フォーム](https://github.com/daftAI2026/Cavalry-i18n/issues/new?template=bug_report.yml)からお知らせください。アイデアやコードの提案も Issue または PR で歓迎します。

## ライセンス

MIT License。Cavalry-i18n を自由に使い、ぜひ貢献してください。
