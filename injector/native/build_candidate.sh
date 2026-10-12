#!/usr/bin/env bash
# [INPUT]: 依赖只读2.8 Frameworks、显式Qt 6.9.2公开头与帮助审批源。
# [OUTPUT]: 编译单一arm64字体/标题/帮助/Guide/Fast候选并核窄合同。
# [POS]: 显式候选入口；不连接默认npm build，不签名、安装或启动App。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  echo "usage: CAVALRY_QT_PREFIX=<Qt-6.9.2-prefix> $0 <readonly-Cavalry-2.8-Contents/Frameworks>" >&2
  exit 2
fi

if [[ "$(uname -m)" != "arm64" ]]; then
  echo "拒绝在非arm64主机生成候选；x86_64 ABI尚无证据。" >&2
  exit 1
fi

FRAMEWORKS_DIR="$(cd "$1" && pwd -P)"
if [[ -z "${CAVALRY_QT_PREFIX:-}" || ! -d "$CAVALRY_QT_PREFIX" ]]; then
  echo "显式提供Qt 6.9.2公开头前缀: CAVALRY_QT_PREFIX=<Qt-6.9.2-prefix>" >&2
  exit 1
fi
QT_PREFIX="$(cd "$CAVALRY_QT_PREFIX" && pwd -P)"
QT_HEADERS="$QT_PREFIX/include"
if [[ "$FRAMEWORKS_DIR" != */Contents/Frameworks ]]; then
  echo "输入必须是所选App的Contents/Frameworks目录。" >&2
  exit 1
fi
for header in QtCore/qglobal.h QtCore/qconfig.h QtCore/qregularexpression.h QtCore/qstring.h \
              QtGui/qfontmetrics.h QtWidgets/qlabel.h QtWidgets/qlayout.h \
              QtWidgets/qtextedit.h; do
  if [[ ! -f "$QT_HEADERS/$header" ]]; then
    echo "缺少显式Qt 6.9.2公开头: $QT_HEADERS/$header" >&2
    exit 1
  fi
done
QT_CONFIG="$QT_HEADERS/QtCore/qconfig.h"
for version in 'QT_VERSION_MAJOR 6' 'QT_VERSION_MINOR 9' 'QT_VERSION_PATCH 2'; do
  if ! grep -Eq "^[[:space:]]*#[[:space:]]*define[[:space:]]+$version$" "$QT_CONFIG"; then
    echo "Qt公开头版本必须是6.9.2: $QT_CONFIG" >&2
    exit 1
  fi
done
for image in libCore.dylib libExtensionLayer.dylib libskia.dylib libApi.dylib; do
  if [[ ! -f "$FRAMEWORKS_DIR/$image" ]]; then
    echo "缺少ABI输入: $FRAMEWORKS_DIR/$image" >&2
    exit 1
  fi
done
if [[ ! -f "$FRAMEWORKS_DIR/QtCore.framework/Versions/A/QtCore" ]]; then
  echo "缺少目标bundle的QtCore 6.9.2映像: $FRAMEWORKS_DIR/QtCore.framework/Versions/A/QtCore" >&2
  exit 1
fi
for framework in QtGui QtWidgets; do
  if [[ ! -f "$FRAMEWORKS_DIR/$framework.framework/Versions/A/$framework" ]]; then
    echo "缺少目标bundle的Qt6.9.2映像: $FRAMEWORKS_DIR/$framework.framework/Versions/A/$framework" >&2
    exit 1
  fi
done
if [[ ! -f "$FRAMEWORKS_DIR/platforms/libqcocoa.dylib" ]]; then
  echo "隐藏布局fixture需要所选bundle的Cocoa QPA插件。" >&2
  exit 1
fi
if [[ ! -f "$FRAMEWORKS_DIR/libfmt.10.dylib" ]]; then
  echo "缺少标题格式化ABI输入: $FRAMEWORKS_DIR/libfmt.10.dylib" >&2
  exit 1
fi
if [[ ! -f "$FRAMEWORKS_DIR/libCavalryUI.dylib" ]]; then
  echo "缺少帮助注册ABI输入: $FRAMEWORKS_DIR/libCavalryUI.dylib" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd -P)"
NATIVE_DIR="$REPO_ROOT/injector/native"
OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/cavalry-native-candidate.XXXXXX")"
DYLIB="$OUT_DIR/libCavalryNativeFontCandidate.dylib"
TEST_BIN="$OUT_DIR/native_font_contract_test"
FAST_TEST_BIN="$OUT_DIR/fast_search_unicode_contract_test"
ABI_PROBE="$OUT_DIR/title-format-fmt10-abi.s"
HELP_TABLE="$OUT_DIR/help-description-table.inc"
HELP_TEST_BIN="$OUT_DIR/help_description_contract_test"
HELP_ABI_TEST_BIN="$OUT_DIR/help_description_veneer_contract_test"
HELP_LAYOUT_TABLE="$OUT_DIR/help-description-table.inc.layout.inc"
HELP_LAYOUT_TEST_BIN="$OUT_DIR/help_popup_layout_contract_test"
GUIDE_BODY_TEST_BIN="$OUT_DIR/guide_body_contract_test"

echo "OUT_DIR: $OUT_DIR"
echo "INPUT_FRAMEWORKS: $FRAMEWORKS_DIR"
echo "QT_PUBLIC_HEADERS: $QT_HEADERS"
node "$REPO_ROOT/tools/build_native_help_description_table.js" \
  --metadata-dir "$(cd "$FRAMEWORKS_DIR/../assets/MetaData" && pwd -P)" \
  --out "$HELP_TABLE" >"$OUT_DIR/help-description-table-command.log"

{
  xcrun --sdk macosx clang++ \
    -std=c++17 -arch arm64 -O1 -Wall -Wextra -Werror \
    -Wno-frame-address -fno-omit-frame-pointer -fno-optimize-sibling-calls \
    -dynamiclib -undefined dynamic_lookup -Wl,-twolevel_namespace \
    -Wl,-install_name,@rpath/libCavalryNativeFontCandidate.dylib \
    -Wl,-headerpad_max_install_names \
    -Wl,-rpath,@loader_path \
    -Wl,-rpath,@executable_path/../Frameworks \
    -I "$NATIVE_DIR" -I "$REPO_ROOT/injector" \
    -I "$QT_HEADERS" -I "$QT_HEADERS/QtCore" \
    -I "$QT_HEADERS/QtGui" -I "$QT_HEADERS/QtWidgets" \
    "-DNATIVE_HELP_DESCRIPTION_TABLE=\"$HELP_TABLE\"" \
    "-DNATIVE_HELP_LAYOUT_ROWS=\"$HELP_LAYOUT_TABLE\"" \
    "$NATIVE_DIR/native_font_candidate.mm" \
    "$NATIVE_DIR/help_popup_layout_adapter.mm" \
    "$NATIVE_DIR/fast_search_unicode_adapter.mm" \
    "$NATIVE_DIR/timeline_owner_observer_arm64.S" \
    "$NATIVE_DIR/viewport_blob_veneer.S" \
    "$NATIVE_DIR/help_description_veneer.S" \
    "$NATIVE_DIR/getpath_font_veneer.S" \
    -L "$FRAMEWORKS_DIR" -lskia "$FRAMEWORKS_DIR/libApi.dylib" \
    "$FRAMEWORKS_DIR/libfmt.10.dylib" \
    "$FRAMEWORKS_DIR/libCavalryUI.dylib" \
    -F "$FRAMEWORKS_DIR" -framework QtCore -framework QtGui -framework QtWidgets \
    -framework CoreText -framework Foundation \
    -o "$DYLIB"
} >"$OUT_DIR/compile.log" 2>&1 || {
  cat "$OUT_DIR/compile.log" >&2
  exit 1
}

# --- QtCore动态依赖 ---------------------------------------------------------
# QtCore从候选所在目录或主程序目录的Frameworks解析。
install_name_tool -change @rpath/QtCore \
  @rpath/QtCore.framework/Versions/A/QtCore "$DYLIB"
install_name_tool -change @rpath/QtGui \
  @rpath/QtGui.framework/Versions/A/QtGui \
  -change @rpath/QtWidgets \
  @rpath/QtWidgets.framework/Versions/A/QtWidgets "$DYLIB"

xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -Wall -Wextra -Werror \
  -I "$NATIVE_DIR" -I "$REPO_ROOT/injector" \
  "$NATIVE_DIR/candidate_contract_test.cpp" -o "$TEST_BIN"
"$TEST_BIN"
echo "PASS: compiled and ran native getter/unknown-owner contract test"
xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -Wall -Wextra -Werror \
  -I "$NATIVE_DIR" "$NATIVE_DIR/guide_body_contract_test.cpp" \
  -o "$GUIDE_BODY_TEST_BIN"
"$GUIDE_BODY_TEST_BIN"
echo "PASS: Guide body caller/source/locale and single-forwarding contract test"
xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -Wall -Wextra -Werror \
  -I "$NATIVE_DIR" \
  "$NATIVE_DIR/fast_search_unicode_contract_test.cpp" -o "$FAST_TEST_BIN"
"$FAST_TEST_BIN"
echo "PASS: Fast C1 options and original-forwarding contract test"
xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -Wall -Wextra -Werror \
  -I "$NATIVE_DIR" -I "$REPO_ROOT/injector" \
  "$NATIVE_DIR/help_description_contract_test.cpp" -o "$HELP_TEST_BIN"
"$HELP_TEST_BIN"
xcrun --sdk macosx clang++ -std=c++17 -O0 -g -arch arm64 \
  -mmacosx-version-min=12.0 \
  "$NATIVE_DIR/help_description_veneer_contract_test.cpp" \
  "$NATIVE_DIR/help_description_veneer_probe.S" \
  "$NATIVE_DIR/help_description_veneer.S" -o "$HELP_ABI_TEST_BIN"
"$HELP_ABI_TEST_BIN"

# --- 同bundle Qt隐藏布局fixture --------------------------------------------
xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -O1 -Wall -Wextra -Werror \
  -Wno-unused-function -include arm_acle.h \
  -I "$NATIVE_DIR" -I "$REPO_ROOT/injector" \
  -I "$QT_HEADERS" -I "$QT_HEADERS/QtCore" \
  -I "$QT_HEADERS/QtGui" -I "$QT_HEADERS/QtWidgets" \
  -I "$OUT_DIR" \
  "-DNATIVE_HELP_DESCRIPTION_TABLE=\"$HELP_TABLE\"" \
  "-DNATIVE_HELP_LAYOUT_ROWS=\"$HELP_LAYOUT_TABLE\"" \
  "$NATIVE_DIR/help_popup_layout_contract_test.cpp" \
  -F "$FRAMEWORKS_DIR" -framework QtCore -framework QtGui -framework QtWidgets \
  -Wl,-headerpad_max_install_names -Wl,-rpath,"$FRAMEWORKS_DIR" \
  -o "$HELP_LAYOUT_TEST_BIN"
install_name_tool -change @rpath/QtCore \
  "$FRAMEWORKS_DIR/QtCore.framework/Versions/A/QtCore" \
  -change @rpath/QtGui "$FRAMEWORKS_DIR/QtGui.framework/Versions/A/QtGui" \
  -change @rpath/QtWidgets "$FRAMEWORKS_DIR/QtWidgets.framework/Versions/A/QtWidgets" \
  "$HELP_LAYOUT_TEST_BIN"
codesign --force --sign - --timestamp=none "$HELP_LAYOUT_TEST_BIN"
codesign --verify --strict "$HELP_LAYOUT_TEST_BIN"
QT_QPA_PLATFORM=cocoa \
QT_QPA_PLATFORM_PLUGIN_PATH="$FRAMEWORKS_DIR/platforms" \
QT_PLUGIN_PATH="$FRAMEWORKS_DIR" \
DYLD_FRAMEWORK_PATH="$FRAMEWORKS_DIR" \
  "$HELP_LAYOUT_TEST_BIN" >"$OUT_DIR/help-popup-layout-test.log" 2>&1 || {
    cat "$OUT_DIR/help-popup-layout-test.log" >&2
    exit 1
  }
cat "$OUT_DIR/help-popup-layout-test.log"

xcrun --sdk macosx clang++ -std=c++17 -arch arm64 -O0 \
  -fno-optimize-sibling-calls -DNATIVE_TITLE_FORMAT_ABI_PROBE_ONLY \
  -I "$NATIVE_DIR" -I "$REPO_ROOT/injector" \
  -S "$NATIVE_DIR/candidate_contract_test.cpp" -o "$ABI_PROBE"
echo "ABI_PROBE: $ABI_PROBE"

PYTHONDONTWRITEBYTECODE=1 python3 "$NATIVE_DIR/candidate_static_contract_test.py" \
  "$REPO_ROOT" "$FRAMEWORKS_DIR" "$DYLIB"
python3 "$NATIVE_DIR/check_candidate_contract.py" \
  "$REPO_ROOT" "$OUT_DIR" "$FRAMEWORKS_DIR" "$DYLIB"
python3 "$NATIVE_DIR/check_help_description_contract.py" \
  "$REPO_ROOT" "$OUT_DIR" "$FRAMEWORKS_DIR" "$DYLIB"
python3 "$NATIVE_DIR/check_help_popup_layout_contract.py" \
  "$REPO_ROOT" "$OUT_DIR" "$FRAMEWORKS_DIR" "$DYLIB"
printf 'PASS: arm64 combined candidate build; not loaded, installed, or consumed by product\n' \
  >"$OUT_DIR/candidate-build-summary.txt"
echo "ARTIFACT: $DYLIB"
echo "SUMMARY: $OUT_DIR/candidate-build-summary.txt"
