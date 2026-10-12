/**
 * [INPUT]: 依赖正式native显示数据、厂商纠错登记、图形/单键译名修订与格式/显示投影
 * [OUTPUT]: 锁定有限图形修订、Twist单键改名和逐槽旧译反例；不作通用NLP判定
 * [POS]: tools的语义回归合同，只消费正式数据，不读取私账、App或构建输出
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { approvedEntries } = require('../languages/native/approved_modules');
const { APPROVED_VENDOR_CORRECTIONS } = require('../languages/native/approved_vendor_corrections');
const { nativeSourceIdentitySha256, resolveTranslations, renderNativePack } = require('./native_language_pack');
const { assertNativeTranslationFormat } = require('./native_translation_format');
const twistSource = require('../languages/native/plugins_twist');
// -- 有限源绑定：module/key/locale/source身份/真实旧值/已裁定新值 ------
const REPAIRS = Object.freeze([
  ["ai_studio_supplement","aiStudio.log.layerStackDirFailed","zh-Hant","26c7b23ee59ac6537052e63db826676f1301f7f6b0a5fbfe7ca6c9b825b2ee54","無法為圖層堆疊建立資料夾：{0}","AI 工作室：無法為圖層堆疊建立資料夾：{0}"],
  ["canva_and_assets","assets.log.canvaSheetAdded","zh-Hant","2733c3a7a2c179d3aaefe8f502aa74c14c0fceb2d2b458b01545a244c56e4da4","已新增 Canva 工作表素材：{0}","已新增 Canva 試算表素材：{0}"],
  ["canva_and_assets","assets.log.canvaSheetApprovalRequired","zh-Hant","912f9765a75101f291d55a3ccf497b546bff438ab3da410b924f4ee6d1868eb9","Canva 工作表：此設計需要審查人員核准後才能匯出。{0}","Canva 試算表：此設計需要審查人員核准後才能匯出。{0}"],
  ["canva_and_assets","assets.log.canvaSheetDesignNotFound","zh-Hant","d1bbffcc6fab0b10b8930185ac9398b07e52f4d4e9a07b12c898acbebf464c84","Canva 工作表：找不到設計。{0}","Canva 試算表：找不到設計。{0}"],
  ["canva_and_assets","assets.log.canvaSheetExportFailed","zh-Hant","57ffc87ea1a0de42cd8aa491b8d99c6ccc83b557456b7124e95abcb1402b25a9","Canva 工作表：匯出失敗。{0}","Canva 試算表：匯出失敗。{0}"],
  ["canva_and_assets","assets.log.canvaSheetInvalidURL","zh-Hant","87db6e83fc8100f400dcbe7fb49a0006530f48bfd082d140c8c21fcfdbcaac7e","Canva 工作表：無法從‘{0}’解析 Canva 設計 URL。","Canva 試算表：無法從‘{0}’解析 Canva 設計 URL。"],
  ["canva_and_assets","assets.log.canvaSheetLicenseRequired","zh-Hant","2d934f355da9fd4263e0b20990d819994dbb01bdaeb14f98a71e0ff9ea5fb7cd","Canva 工作表：需要 Canva Pro 授權才能匯出此設計。{0}","Canva 試算表：需要 Canva Pro 授權才能匯出此設計。{0}"],
  ["canva_and_assets","assets.log.canvaSheetMissingScope","zh-Hant","cf1361aad6de2562edef56070ebdd710675f0ddae57d92aa89f80df7da9f08bc","Canva 工作表：您的 Canva 登入缺少此功能所需的權限。請登出並重新登入以授予這些權限。({0})","Canva 試算表：您的 Canva 登入缺少此功能所需的權限。請登出並重新登入以授予這些權限。({0})"],
  ["canva_and_assets","assets.log.canvaSheetNotSignedIn","zh-Hant","ede1724d7f6a8243b14dd1bbccdeb3a5ad2b24a72c1858af0328c06c2ff24459","Canva 工作表：請先登入 Canva。","Canva 試算表：請先登入 Canva。"],
  ["canva_and_assets","assets.log.canvaSheetPermissionDenied","zh-Hant","5dec46dd4217aba799b19b1f4d92ff3c492e9837ad032b61d7febe616dea5d45","Canva 工作表：您沒有存取此設計的權限。{0}","Canva 試算表：您沒有存取此設計的權限。{0}"],
  ["canva_and_assets","assets.log.canvaSheetRateLimited","zh-Hant","6f51316470762ff48d9ee2f928da9c9efd75ab0b6b647ee13c43c680270996c3","Canva 工作表：匯出要求過多，請稍後重試。{0}","Canva 試算表：匯出要求過多，請稍後重試。{0}"],
  ["canva_and_assets","assets.log.canvaSheetUpdated","zh-Hant","d6ac877bcac5e953483486e45276e03df7c9a722bf12094f0e7f772f0549e1b2","已更新 Canva 工作表素材：{0}","已更新 Canva 試算表素材：{0}"],
  ["ai_studio_reuse_and_credits","aiStudio.brief.style.flat","zh-Hans","d88d976b41182ff7233b9f1049f2e864ea9a28f991e1e65177e712ea42b0e846","平面","扁平"],
  ["ai_studio_reuse_and_credits","aiStudio.brief.style.flat","zh-Hant","d88d976b41182ff7233b9f1049f2e864ea9a28f991e1e65177e712ea42b0e846","平面","扁平"],
  ["remaining_global_ui_01","attributeEditor.cellAnimation.menu.keyframe","ja_JP","2b64e6d13d626dadd59753e83c5013fe7716d20c8485da2eb8649c3681c6a83a","キーフレーム","キーフレームを設定"],
  ["remaining_global_ui_02","controlCentre.player.tooltip.firstFrame","zh-Hant","857d7284300dc44ff99f07c49704e652430981fd3efc927010844f39b0d3d3a6","前往第一格。","前往第一個影格。"],
  ["remaining_global_ui_02","controlCentre.player.tooltip.lastFrame","zh-Hant","773dd39b034c6d4e88111b982b776ae697d3ad37a5b82572064097f1d70f89f0","前往最後一格。","前往最後一個影格。"],
  ["remaining_global_ui_02","controlCentre.player.tooltip.nextFrame","zh-Hant","d89181cd1c81a2124733309ea823fe7b5b2059fa3d833ba97592b46667c56f57","前往下一格。","前往下一個影格。"],
  ["remaining_global_ui_02","controlCentre.player.tooltip.previousFrame","zh-Hant","a542a922b4eea76b9f336e33ebca7a9a33450e36d457c328199958bc46fe8a2c","前往上一格。","前往上一個影格。"],
  ["remaining_global_ui_02","defaultAssets.log.videoFirstFrameFailed","zh-Hant","897b9250c319932c709d2ad713c2a4bba6015c063240eaa8908eef281e987f7b","無法解碼 {0} 的第一格。改為將整個檔案載入記憶體。","無法解碼 {0} 的第一個影格。改為將整個檔案載入記憶體。"],
  ["nodes_accumulator_renderqueue","attrInfo:renderQueueItem.fileName","zh-Hans","929c4ed6facc2f41abe55c3bf95bfa0c578e3411e1311731d22190a0ec186265","设置输出的文件名。在此输入框中右键单击以添加 渲染标记。","设置输出的文件名。在此输入框中右键单击以添加渲染标记。"],
  ["nodes_accumulator_renderqueue","attrInfo:renderQueueItem.fileName","zh-Hant","929c4ed6facc2f41abe55c3bf95bfa0c578e3411e1311731d22190a0ec186265","設定輸出的檔案名稱。在此輸入框中按一下滑鼠右鍵以新增 算繪標記。","設定輸出的檔案名稱。在此輸入框中按一下滑鼠右鍵以新增算繪標記。"],
  ["nodes_accumulator_renderqueue","attrInfo:renderQueueItem.fileName","ja_JP","929c4ed6facc2f41abe55c3bf95bfa0c578e3411e1311731d22190a0ec186265","出力のファイル名を設定します。この入力欄を右クリックして レンダートークン を追加します。","出力のファイル名を設定します。この入力欄を右クリックしてレンダートークンを追加します。"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.108","zh-Hans","58a7d32b7b1be74c87c7edbf69b8b9ec7b5a3c1074d9df9cd05d6c269de7696a","传统形式","传统字形"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.108","zh-Hant","58a7d32b7b1be74c87c7edbf69b8b9ec7b5a3c1074d9df9cd05d6c269de7696a","傳統形式","傳統字形"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.108","ja_JP","58a7d32b7b1be74c87c7edbf69b8b9ec7b5a3c1074d9df9cd05d6c269de7696a","伝統的形式","伝統的な字形"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.98","zh-Hans","aff744f1fe6f44adb61482f5207af045d6aeac4f047ef7d60b8db3c53e224608","简化形式","简化字形"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.98","zh-Hant","aff744f1fe6f44adb61482f5207af045d6aeac4f047ef7d60b8db3c53e224608","簡化形式","簡化字形"],
  ["nodes_apply_opentype","nodeAttrEnum:applyOpenType.feature.98","ja_JP","aff744f1fe6f44adb61482f5207af045d6aeac4f047ef7d60b8db3c53e224608","簡略化形式","簡略化した字形"],
  ["nodes_auto_animate","attrInfo:autoAnimate.automaticTimeOffset","ja_JP","2af996ba4793dac17b6511c48b0bb3d98152f8e996b4c220ea190ca351356b29","チェックを外すと、ビヘイビア（例：スタガー）をアニメーション時間オフセットに接続してカスタマイズできます。","チェックを外すと、ビヘイビア（例：スタッガー）をアニメーション時間オフセットに接続してカスタマイズできます。"],
  ["menus_file_edit_create_help","menu.file.exportArchive","zh-Hans","1d024dadc284c615f9e4e11307751210e6959270c31aa03f94affc4a0b578e8d","为 Canva 导出 (Beta)...","为 Canva 导出（测试版）..."],
  ["menus_file_edit_create_help","menu.file.exportArchive","zh-Hant","1d024dadc284c615f9e4e11307751210e6959270c31aa03f94affc4a0b578e8d","為 Canva 匯出 (Beta)...","為 Canva 匯出（測試版）..."],
  ["menus_file_edit_create_help","menu.file.exportArchive","ja_JP","1d024dadc284c615f9e4e11307751210e6959270c31aa03f94affc4a0b578e8d","Canva 用に書き出し (Beta)...","Canva 用に書き出し（ベータ）..."],
  ["menus_file_edit_create_help","menu.file.importCanvaSheet","zh-Hant","df13ea7261db793f048af527f3c8fdc47d7f1e62efd87f0a8baa83feb41d6060","匯入 Canva 工作表...","匯入 Canva 試算表..."],
  ["menus_comp_animation","menu.anim.moveLayerEnd","zh-Hans","fb9291228629c90649e09d492a292e550c7ce80fd180381f9dc9fafa3fe4b55f","将图层终点移到当前帧","将图层出点移到当前帧"],
  ["menus_comp_animation","menu.anim.moveLayerEnd","zh-Hant","fb9291228629c90649e09d492a292e550c7ce80fd180381f9dc9fafa3fe4b55f","將圖層終點移到目前影格","將圖層出點移到目前影格"],
  ["menus_comp_animation","menu.anim.moveLayerStart","zh-Hans","cc0d487cbc529be4a1166f2297dfa6dee7e0f43e3bce36c49919ad6cef7b7e1e","将图层起点移到当前帧","将图层入点移到当前帧"],
  ["menus_comp_animation","menu.anim.moveLayerStart","zh-Hant","cc0d487cbc529be4a1166f2297dfa6dee7e0f43e3bce36c49919ad6cef7b7e1e","將圖層起點移到目前影格","將圖層入點移到目前影格"],
  ["menus_file_edit_create_help","menu.file.importCanvaSheet","zh-Hans","df13ea7261db793f048af527f3c8fdc47d7f1e62efd87f0a8baa83feb41d6060","导入 Canva 工作表...","导入 Canva 表格..."],
  ["menus_other","menu.assets.importCanvaSheet","zh-Hans","9fa27a50a63e1a7575e2c065ddfeb49c73154cbf625c2f10184049e444e5a491","导入 Canva 工作表...","导入 Canva 表格..."],
  ["menus_other","menu.assets.importCanvaSheet","zh-Hant","9fa27a50a63e1a7575e2c065ddfeb49c73154cbf625c2f10184049e444e5a491","匯入 Canva 工作表...","匯入 Canva 試算表..."],
  ["menus_other","menu.assets.importCanvaSheetPro","zh-Hans","bdf99b3ae9aafaf5fa03cea93f13a5e2e0a96ca8b1605651b438e1c9eb7d7290","导入 Canva 工作表... (Pro)","导入 Canva 表格... (Pro)"],
  ["menus_other","menu.assets.importCanvaSheetPro","zh-Hant","bdf99b3ae9aafaf5fa03cea93f13a5e2e0a96ca8b1605651b438e1c9eb7d7290","匯入 Canva 工作表... (Pro)","匯入 Canva 試算表... (Pro)"],
  ["menus_other","menu.assets.openCanvaSheetInBrowser","zh-Hans","85ef51301a94bc73b52a140d21c6fdc18db60ef2445a50eac7f6d5b055de3511","在浏览器中打开 Canva 工作表","在浏览器中打开 Canva 表格"],
  ["menus_other","menu.assets.openCanvaSheetInBrowser","zh-Hant","85ef51301a94bc73b52a140d21c6fdc18db60ef2445a50eac7f6d5b055de3511","在瀏覽器中開啟 Canva 工作表","在瀏覽器中開啟 Canva 試算表"],
  ["menus_other","menu.assets.replaceCanvaSheet","zh-Hans","d8a1f28fb91dddc24425bf98fe6a0027aa50a1fa0bca43075a41316f43c37dd0","替换 Canva 工作表...","替换 Canva 表格..."],
  ["menus_other","menu.assets.replaceCanvaSheet","zh-Hant","d8a1f28fb91dddc24425bf98fe6a0027aa50a1fa0bca43075a41316f43c37dd0","取代 Canva 工作表...","取代 Canva 試算表..."],
  ["guides","onboarding.firstLaunch.step4.body","zh-Hans","7bb8a1bc5f25e2b7281fa5080c3caf818680c5c1bb3147e98d8470f024ed1887","使用<b>文件 > 导入资源...</b>或在此窗口中双击来导入图像、视频、字体、音频文件等。","使用<b>文件 > 导入素材...</b>或在此窗口中双击来导入图像、视频、字体、音频文件等。"],
  ["guides","onboarding.firstLaunch.step4.title","zh-Hans","5ab0a8a8f4167d162e3f2a2444bfd74ba19fcafc7777b88e2ebcec8ed1ebb6d6","资源窗口","素材窗口"],
  ["remaining_global_ui_01","attributeEditor.cellAnimation.menu.keyframe","zh-Hans","2b64e6d13d626dadd59753e83c5013fe7716d20c8485da2eb8649c3681c6a83a","关键帧","设置关键帧"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignLeft","zh-Hans","fa953c0d6049151325094b1744321f942baf57eebd4498146527e4374bc9b7cc","关键帧左对齐","将所选关键帧的值对齐到最左侧所选关键帧的值"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignLeft","zh-Hant","fa953c0d6049151325094b1744321f942baf57eebd4498146527e4374bc9b7cc","關鍵幀左對齊","將所選關鍵幀的值對齊至最左側所選關鍵幀的值"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignLeft","ja_JP","fa953c0d6049151325094b1744321f942baf57eebd4498146527e4374bc9b7cc","キーフレームを左揃え","選択したキーフレームの値を、選択範囲で最も左のキーフレームの値に合わせます。"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignRight","zh-Hans","5efc0a2a18f12426c646448091ce920ff54ec564dac408eba1649a656f71a9db","关键帧右对齐","将所选关键帧的值对齐到最右侧所选关键帧的值"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignRight","zh-Hant","5efc0a2a18f12426c646448091ce920ff54ec564dac408eba1649a656f71a9db","關鍵幀右對齊","將所選關鍵幀的值對齊至最右側所選關鍵幀的值"],
  ["remaining_global_ui_03","graphEditor.footer.tooltip.alignRight","ja_JP","5efc0a2a18f12426c646448091ce920ff54ec564dac408eba1649a656f71a9db","キーフレームを右揃え","選択したキーフレームの値を、選択範囲で最も右のキーフレームの値に合わせます。"],
  ["remaining_global_ui_03","jsEditor.button.newTab","zh-Hant","975e78855332f29175fbb1ee0ebc35af77315df5dbeae94b0ed5cfb7fafe5a79","新增腳本索引標籤","新增腳本分頁"],
  ["nodes_chop_path","attrInfo:chopPath.offset","ja_JP","a2e4df982811e95ba0f2fe7195705315ed8f7aea0927b3c5bc392875bbc75b3e","パスの切断部分をオフセットします。ランダム、ノイズ、スタガーなどのビヘイビアを接続して、面白い効果を作ることもできます。","パスの切断部分をオフセットします。ランダム、ノイズ、スタッガーなどのビヘイビアを接続して、面白い効果を作ることもできます。"],
  ["nodes_chop_path","attrInfo:chopPath.spread","ja_JP","425245f7d8bc33949fdfd1a01960a4bea3ef47d0a6092caaef7d2c13af453921","切断同士の間隔を設定します。ランダム、ノイズ、スタガーなどのビヘイビアを接続して、面白い効果を作ることもできます。","切断同士の間隔を設定します。ランダム、ノイズ、スタッガーなどのビヘイビアを接続して、面白い効果を作ることもできます。"],
  ["nodes_chop_path","nodeAttr:chopPath.spreadHelp","ja_JP","2c20226836e839bb55f6c001f56971a162f9327a4c9c7a265015f9d9ea9457e5","ランダム、ノイズ、スタガーなどのビヘイビアを「間隔」および／または「オフセット」に接続すると、面白い効果を作れます。","ランダム、ノイズ、スタッガーなどのビヘイビアを「間隔」および／または「オフセット」に接続すると、面白い効果を作れます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapeOpacity","ja_JP","69129679e53d74e299c5cc33482cfa83cc170be7dfa3f137c446e99fa4cb199d","子メッシュの不透明度を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュの不透明度を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapePosition","ja_JP","b42e213c4f6ebea83cb618dd0a8e3305fb90e0f6f15dc281eb933dd958df6b9d","子メッシュの位置を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュの位置を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapeRotation","ja_JP","f1a0bfa51c93554e623f58c600059a5937605728f7e66226a6fcef53361b5b86","子メッシュの回転を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュの回転を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapeScale","ja_JP","e8604c80d2e8b573a8cd4bc17a1e4f7eadfae382082cd894ccc8217fd6108cd5","子メッシュのスケールを設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュのスケールを設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapeTimeOffset","ja_JP","21f6f7013baa8a5190d5699a5f1f57f3f5ccc2977969b1bdc339bd4aa5f9d3a3","子メッシュの時間オフセットをフレーム単位で設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュの時間オフセットをフレーム単位で設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["nodes_sub_mesh","attrInfo:subMesh.shapeVisibility","ja_JP","de0a3391969a1a678297de98b9ba88110e4963fdec6eee57ca53d29a3bc497a2","子メッシュの可視性を設定します。ビヘイビア（ランダムやスタガーなど）を接続すると、子メッシュごとに異なる値を適用できます。","子メッシュの可視性を設定します。ビヘイビア（ランダムやスタッガーなど）を接続すると、子メッシュごとに異なる値を適用できます。"],
  ["remaining_node_ui_a_01","nodeAttr:chevronHead.chevronLength","zh-Hans","3b92d6ce987a8c21ac2f5c03df744ffbe2d828142060910b4e9d96943621d0ad","V 形长度","V 形厚度"],
  ["remaining_node_ui_a_01","nodeAttr:chevronHead.chevronLength","zh-Hant","3b92d6ce987a8c21ac2f5c03df744ffbe2d828142060910b4e9d96943621d0ad","V 形長度","V 形厚度"],
  ["remaining_node_ui_a_01","nodeAttr:chevronHead.chevronLength","ja_JP","3b92d6ce987a8c21ac2f5c03df744ffbe2d828142060910b4e9d96943621d0ad","V 形長さ","V 字の太さ"],
  ["remaining_node_ui_a_01","attrInfo:colorCollisionEvent.fadeToThirdColor","zh-Hans","2edbedcc6e9e75b7171d2ecb7322876cd152100af03ba067c2ce896bdae0a74f","形状将淡入第三颜色，而不是淡回原始颜色。","形状将渐变为第三种颜色，而不是渐变回原始颜色。"],
  ["remaining_node_ui_a_01","attrInfo:colorCollisionEvent.fadeToThirdColor","zh-Hant","2edbedcc6e9e75b7171d2ecb7322876cd152100af03ba067c2ce896bdae0a74f","形狀將淡入第三顏色，而不是淡回原始顏色。","形狀將漸變為第三種顏色，而不是漸變回原始顏色。"],
  ["remaining_node_ui_a_01","nodeAttr:colorCollisionEvent.fadeToThirdColor","zh-Hans","ded61193bded542ac7fec755e27bf0fe51d5a0cb37462b8d21ee913d1d6a9f08","淡入第三颜色","渐变为第三种颜色"],
  ["remaining_node_ui_a_01","nodeAttr:colorCollisionEvent.fadeToThirdColor","zh-Hant","ded61193bded542ac7fec755e27bf0fe51d5a0cb37462b8d21ee913d1d6a9f08","淡入第三顏色","漸變為第三種顏色"],
  ["remaining_node_ui_a_01","nodeAttr:colorCollisionEvent.fadeTime","zh-Hans","f557ad57852e839a62066f4fedfe21b6c9979067761695b9f47cfca8d9f0d736","淡入淡出时间","颜色渐变时间"],
  ["remaining_node_ui_a_01","nodeAttr:colorCollisionEvent.fadeTime","zh-Hant","f557ad57852e839a62066f4fedfe21b6c9979067761695b9f47cfca8d9f0d736","淡入淡出時間","顏色漸變時間"],
  ["plugins_bilateral_blur","nodeAttr:sceneGroup::bilateralBlurFilter.amount","ja_JP","2894416b239b6d8849400231fa15140301f7f8d9b653d676596f6dd96e36d057","金額","量"],
  ["plugins_box_blur","nodeAttr:sceneGroup::boxBlurFilter.amount","ja_JP","464e877d0a47bdb650209af39b150d192bf94190b340bd3d0f2fb870458da488","金額","量"],
  ["plugins_bulge","nodeAttr:sceneGroup::bulgeFilter.amount","ja_JP","1e5acb5bd380459d1b6e6924fc4875906d51df9bfd0bb33919230ff1d4a31d26","金額","強度"],
  ["plugins_erosion","nodeAttr:sceneGroup::erosionFilter.amount","ja_JP","6f76d41bbc2f70d89bda310d33d2aff1b0db95166539d61ac8a6b07544306f1a","金額","縮小量"],
  ["plugins_gaussian_blur","nodeAttr:sceneGroup::gaussianBlurFilter.amount","ja_JP","13ed8cc6975d76f3053af67db98cd5255550f058e1ee4363d6866feb504e1558","金額","量"],
  ["plugins_grain","nodeAttr:sceneGroup::grainFilter.shadow","ja_JP","36cd57694c22bca35491e38df72c810221dcddc7fd55ed18b4cfddacd9784204","影付き","シャドウ"],
  ["plugins_grain","nodeAttrEnum:sceneGroup::grainFilter.logGrain.1","ja_JP","9e62cc77065b224df8aaef782b31509a4fc9f539564dd6d54533b02284e1aa7f","丸太","ログ"],
  ["plugins_light_sweep","nodeAttrEnum:sceneGroup::lightSweepFilter.shape.0","ja_JP","dccef0e57ab65995d75d1c4718937169fb7593cb96e412da356e2336598d9373","行","直線"],
  ["plugins_ripple","attrInfo:sceneGroup::rippleFilter.mode","ja_JP","bd3e97c3e47b0b109248da062445006235cf934b233703ed6bc83fb376a3ddc9","波紋の種類を選択します。「線」は波を一方向に送り、「同心円」は中心点からリングを広げ、「スパイラル」はそれらのリングをアーム状に巻き付けます。","波紋の種類を選択します。「リニア」は波を一方向に送り、「同心円」は中心点からリングを広げ、「スパイラル」はそれらのリングをアーム状に巻き付けます。"],
  ["plugins_spherise","nodeAttr:sceneGroup::spheriseFilter.visibility","ja_JP","761eab6e59a6e7306fe36341df35f6eec69748c260e6e00e609a3f2c554d4429","表示/非表示の設定","表示する面"],
  ["plugins_spherise","nodeAttrEnum:sceneGroup::spheriseFilter.visibility.2","ja_JP","0ea03f8c2f092827f0865f47baf71e83bf5195a7c87b16574b0a8ef923632ae7","戻る","後面"],
  ["plugins_twist","nodeAttrEnum:sceneGroup::twistFilter.falloff.1","ja_JP","3c29e70b503e91ac2778a637803f4139fc7ff7ba4537b4468754a2716e25a529","流ちょう","スムーズ"],
  ["plugins_zoom_blur","nodeAttr:sceneGroup::zoomBlurFilter.amount","ja_JP","2bfbccb3617e9174e799ad30843d70304129f6f859e45d3f625c28bcd375dc56","金額","量"],
]);
function assertRepairs(rows) {
  const indexed = new Map(rows.map(row => [row.key, row]));
  for (const [, key, locale, identity, , text] of REPAIRS) {
    const row = indexed.get(key);
    assert.ok(row, `canonical repaired key: ${key}`);
    assert.equal(nativeSourceIdentitySha256(row), identity, `${key} frozen source identity`);
    assert.equal(row.translations[locale].text, text, `${key}/${locale} graphics meaning`);
    assertNativeTranslationFormat(row.source, text);
  }
}
test('graphics repairs preserve every source identity and exact approved display value', () => {
  assert.equal(REPAIRS.length, 88);
  assert.equal(new Set(REPAIRS.map(([, key, locale]) => key + '/' + locale)).size, REPAIRS.length);
  for (const [module, key] of REPAIRS) assert.ok(require(`../languages/native/${module}`).entries.some(row => row.key === key));
  assertRepairs(approvedEntries());
});
test('every actual old graphics translation is rejected by its finite source-bound guard', () => {
  const rows = approvedEntries();
  assertRepairs(rows);
  for (const [, key, locale, , before] of REPAIRS) {
    const bad = structuredClone(rows);
    bad.find(row => row.key === key).translations[locale].text = before;
    assert.throws(() => assertRepairs(bad), /graphics meaning/, `${key}/${locale} old text`);
  }
});
test('real selection and display pack retain repaired values without leaking approval metadata', () => {
  const rows = approvedEntries();
  assertRepairs(rows);
  for (const locale of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
    const reviews = rows.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(rows, locale, reviews, APPROVED_VENDOR_CORRECTIONS);
    const pack = JSON.parse(renderNativePack(resolved))[0];
    for (const [, key, language, , , text] of REPAIRS) {
      if (language === locale) assert.deepEqual(pack.value[key], { 'UI-text': text });
    }
    assert.doesNotMatch(JSON.stringify(pack), /vendorCorrection|approvedBy|approvalReceiptSha256/);
  }
});

// -- 厂商来源与实际纠错闭合；390来源槽不等于全部原样采用 ----------
test('finite vendor registry closes exactly against actual corrected keys and preserved originals', () => {
  const rows = approvedEntries();
  const indexed = new Map(rows.map(row => [row.key, row]));
  assert.equal(APPROVED_VENDOR_CORRECTIONS.length, 13);
  assert.equal(new Set(APPROVED_VENDOR_CORRECTIONS.map(row => row.key)).size, 13);
  for (const proof of APPROVED_VENDOR_CORRECTIONS) {
    const row = indexed.get(proof.key);
    const decision = row.translations.ja_JP;
    assert.equal(proof.approvalReceiptSha256, '5c85772dbbe527736eb35487cd63f6c5f4a1d97fbe2a0de0fa23d06694e7abc6');
    assert.equal(nativeSourceIdentitySha256(row), proof.sourceIdentitySha256);
    assert.equal(require('node:crypto').createHash('sha256').update(decision.text).digest('hex'), proof.translationSha256);
    assert.notEqual(decision.text, row.vendorJapanese);
    assert.deepEqual(decision.vendorCorrection, { approvedBy: 'primary-agent',
      approvalState: 'approved-source-bound-vendor-correction', sourceIdentitySha256: proof.sourceIdentitySha256,
      translationSha256: proof.translationSha256, vendorJapanese: row.vendorJapanese,
      approvalReceiptSha256: proof.approvalReceiptSha256 });
  }
  const reviews = rows.map(row => ({ key: row.key, source: row.source, ...row.translations.ja_JP }));
  const resolved = resolveTranslations(rows, 'ja_JP', reviews, APPROVED_VENDOR_CORRECTIONS);
  const corrected = resolved.rows.filter(row => row.status === 'vendor-corrected');
  const original = resolved.rows.filter(row => row.status === 'vendor');
  assert.equal(corrected.length, 13);
  assert.equal(original.length, 377);
  assert.deepEqual(corrected.map(row => row.key).sort(), APPROVED_VENDOR_CORRECTIONS.map(row => row.key).sort());
  for (const row of original) assert.equal(row.text, row.vendorJapanese);
  assert.throws(() => resolveTranslations(rows, 'ja_JP', reviews), /vendor correction/i);
});

// -- 单键修订合同：锁定新译值、历史摘要、来源身份与其余12键 ----------
const TWIST_REVISION_BINDINGS = Object.freeze({
  key: 'nodeName:sceneGroup::twistFilter',
  sourceIdentitySha256: 'af1165e23d2ff3d2bcaacc53daed89df7f8a9054319d79fa5ea32574dee82d30',
  preservedNormalizedEntriesSha256: '0a12b941569e21162e7a804dc9f615690653e97de3cfe23dfd38a5b77f61915a',
  rootApprovalDecisionSha256: '8764921c320f0ab2e0ae519f29b162d70cafd222f2538875a96b14596b9140bd',
  independentReviewReportSha256: '0348b31468b8dbb66a19ce2e40a395539dac7e39fda0762fe7896180d83719dc',
  locales: {
    'zh-Hans': { previous: '扭曲', previousSha256: 'b1837195155340d21109c98e2cb35a434ed75241965152c6fe121f5b8d9a3b6b', approved: '扭转', approvedSha256: '3d90591f6e6c851be30ca6f6216f6e007b016e4fed32f727a37ac8de46d96d0f' },
    'zh-Hant': { previous: '扭曲', previousSha256: 'b1837195155340d21109c98e2cb35a434ed75241965152c6fe121f5b8d9a3b6b', approved: '扭轉', approvedSha256: '3d593ef619febd64b3e8714e9882c8eca1c7c7256dbc29569593c0a0e9da8277' },
    ja_JP: { previous: 'ひねり', previousSha256: '2a41a8b6b618701268b4fcc0d55b71696d48f1a6bf313c02bdd122fcd1d32e02', approved: 'ひねり', approvedSha256: '2a41a8b6b618701268b4fcc0d55b71696d48f1a6bf313c02bdd122fcd1d32e02' },
  },
  historicalDecisionDigests: {
    'zh-Hans': '0c2362769ee98475318945851bf06e1339dfcdf32be466740fa23e42a2aac69d',
    'zh-Hant': '63fd51b5bcd193dbe7345d98d1598491c232f4f3e8b5a4fab1d94411bebdb456',
    ja_JP: 'fc74a1329f07e4ffd362653d5584364c759c3716402b4da17c36e8006575774d',
  },
  historicalApprovedAt: '2026-10-03T21:49:39.823Z',
  historicalRootAdjudicationSha256: 'af3329fccece6f28bbff3ce09a729759e7c1b4a5661f7f67b33ce32faf1c3ed8',
});
const sha256Text = text => require('node:crypto').createHash('sha256').update(text).digest('hex');
function assertTwistNameRevision(entries, revision) {
  assert.equal(entries.length, 13, 'the original Twist catalog remains 13 keys');
  assert.equal(revision.revisionId, 'c3-twist-name-20261009-r1');
  assert.equal(revision.key, TWIST_REVISION_BINDINGS.key);
  assert.equal(revision.sourceIdentitySha256, TWIST_REVISION_BINDINGS.sourceIdentitySha256);
  assert.equal(revision.preservedNormalizedEntriesSha256, TWIST_REVISION_BINDINGS.preservedNormalizedEntriesSha256);
  assert.equal(revision.rootApprovalDecisionSha256, TWIST_REVISION_BINDINGS.rootApprovalDecisionSha256, 'root approval decision binding');
  assert.equal(revision.independentReviewReportSha256, TWIST_REVISION_BINDINGS.independentReviewReportSha256, 'independent review binding');
  assert.equal(revision.approvedBy, 'primary-agent');
  assert.equal(revision.approvalState, 'approved-single-key-name-revision');
  assert.equal(revision.scope, 'zh-Hans/zh-Hant node display only; source, notes, owner, vendorJapanese, ja_JP, and other entries remain unchanged');
  assert.deepEqual(revision.locales, TWIST_REVISION_BINDINGS.locales, 'the revision contains only the three explicit locale values');
  const row = entries.find(entry => entry.key === revision.key);
  assert.ok(row, 'the approved Twist name key exists');
  assert.equal(nativeSourceIdentitySha256(row), revision.sourceIdentitySha256, 'Twist name source identity');
  for (const [locale, expected] of Object.entries(TWIST_REVISION_BINDINGS.locales)) {
    assert.equal(row.translations[locale].text, expected.approved, `${locale} approved value`);
    assert.equal(sha256Text(row.translations[locale].text), expected.approvedSha256, `${locale} approved value digest`);
    assertNativeTranslationFormat(row.source, row.translations[locale].text);
  }
  const normalized = structuredClone(entries);
  const normalizedName = normalized.find(entry => entry.key === revision.key);
  normalizedName.translations['zh-Hans'].text = TWIST_REVISION_BINDINGS.locales['zh-Hans'].previous;
  normalizedName.translations['zh-Hant'].text = TWIST_REVISION_BINDINGS.locales['zh-Hant'].previous;
  assert.equal(sha256Text(JSON.stringify(normalized)), revision.preservedNormalizedEntriesSha256,
    'all original entries match after reverting only the two approved locale slots');
  assert.equal(twistSource.provenance.approvedAt, TWIST_REVISION_BINDINGS.historicalApprovedAt);
  assert.equal(twistSource.provenance.rootAdjudicationSha256, TWIST_REVISION_BINDINGS.historicalRootAdjudicationSha256);
  assert.deepEqual(twistSource.provenance.translationDecisionsSha256, TWIST_REVISION_BINDINGS.historicalDecisionDigests);
}

test('Twist name revision preserves the historical 13-key approval and changes only two locale slots', () => {
  assertTwistNameRevision(twistSource.entries, twistSource.provenance.nameRevision);
});
test('Twist name revision rejects stale values, source drift, unbound approval, and another entry change', () => {
  const revision = twistSource.provenance.nameRevision;
  const stale = structuredClone(twistSource.entries);
  stale.find(entry => entry.key === revision.key).translations['zh-Hans'].text = '扭曲';
  assert.throws(() => assertTwistNameRevision(stale, revision), /approved value/);

  const sourceDrift = structuredClone(twistSource.entries);
  sourceDrift.find(entry => entry.key === revision.key).source = 'Twisted';
  assert.throws(() => assertTwistNameRevision(sourceDrift, revision), /Twist name source identity/);

  const approvalDrift = structuredClone(revision);
  approvalDrift.rootApprovalDecisionSha256 = '0'.repeat(64);
  assert.throws(() => assertTwistNameRevision(twistSource.entries, approvalDrift), /root approval decision binding/);

  const otherEntryDrift = structuredClone(twistSource.entries);
  otherEntryDrift.find(entry => entry.key === 'nodeAttr:sceneGroup::twistFilter.angle').translations['zh-Hans'].text = '角度值';
  assert.throws(() => assertTwistNameRevision(otherEntryDrift, revision), /original entries match/);
});
test('real native packs project the Twist revision and preserve the distinct Distortion name', () => {
  assertTwistNameRevision(twistSource.entries, twistSource.provenance.nameRevision);
  const rows = approvedEntries();
  const names = {
    'zh-Hans': '扭转',
    'zh-Hant': '扭轉',
    ja_JP: 'ひねり',
  };
  const distortion = rows.find(row => row.key === 'nodeName:distortionFilter');
  assert.ok(distortion, 'the separate Distortion owner remains present');
  assert.deepEqual({
    'zh-Hans': distortion.translations['zh-Hans'].text,
    'zh-Hant': distortion.translations['zh-Hant'].text,
    ja_JP: distortion.translations.ja_JP.text,
  }, { 'zh-Hans': '扭曲', 'zh-Hant': '扭曲', ja_JP: 'ディストーション' });
  for (const locale of ['zh-Hans', 'zh-Hant', 'ja_JP']) {
    const reviews = rows.map(row => ({ key: row.key, source: row.source, ...row.translations[locale] }));
    const resolved = resolveTranslations(rows, locale, reviews, APPROVED_VENDOR_CORRECTIONS);
    const pack = JSON.parse(renderNativePack(resolved))[0];
    assert.deepEqual(pack.value[TWIST_REVISION_BINDINGS.key], { 'UI-text': names[locale] });
    assert.deepEqual(pack.value['nodeName:distortionFilter'], { 'UI-text': distortion.translations[locale].text });
    assert.doesNotMatch(JSON.stringify(pack), /nameRevision|rootApprovalDecisionSha256|independentReviewReportSha256/);
  }
});
