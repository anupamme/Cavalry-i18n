#!/usr/bin/env bash
# [INPUT]: 依赖选择的Welcome veneer源、Apple arm64工具链与隔离输出目录。
# [OUTPUT]: 构造真实dyld interpose链并断言early-constructor透传。
# [POS]: vendor-free回归入口；不读取App、Qt或产品profile。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
set -euo pipefail

if [[ "$#" -ne 3 ]]; then
  echo "usage: $0 <green|red> <welcome_log_it_veneer.S> <output-dir>" >&2
  exit 2
fi
MODE="$1"
VENEER_SOURCE="$(cd "$(dirname "$2")" && pwd -P)/$(basename "$2")"
OUT_DIR="$3"
NATIVE_DIR="$(cd "$(dirname "$0")" && pwd -P)"

if [[ "$MODE" != "green" && "$MODE" != "red" ]]; then
  echo "mode must be green or red" >&2
  exit 2
fi
if [[ ! -f "$VENEER_SOURCE" ]]; then
  echo "missing veneer source: $VENEER_SOURCE" >&2
  exit 2
fi
mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd -P)"
SDK_CLANG=(xcrun --sdk macosx clang++)
COMMON=("${SDK_CLANG[@]}" -std=c++17 -arch arm64 -mmacosx-version-min=12.0 \
        -Wall -Wextra -Werror -Wno-unused-parameter)

"${COMMON[@]}" -dynamiclib -Wl,-bind_at_load \
  -Wl,-install_name,@rpath/libwelcome_fixture_support.dylib \
  -o "$OUT_DIR/libwelcome_fixture_support.dylib" \
  "$NATIVE_DIR/welcome_dyld_fixture_support.cpp"

"${COMMON[@]}" -dynamiclib -Wl,-bind_at_load \
  -Wl,-install_name,@rpath/libspdlog.1.13.dylib \
  -Wl,-rpath,@loader_path \
  -o "$OUT_DIR/libspdlog.1.13.dylib" \
  "$NATIVE_DIR/welcome_dyld_fixture_spdlog.S" \
  -L "$OUT_DIR" -lwelcome_fixture_support

"${COMMON[@]}" -dynamiclib -Wl,-bind_at_load \
  -Wl,-install_name,@rpath/libwelcome_fixture_early_caller.dylib \
  -Wl,-rpath,@loader_path \
  -o "$OUT_DIR/libwelcome_fixture_early_caller.dylib" \
  "$NATIVE_DIR/welcome_dyld_fixture_early_caller.cpp" \
  "$NATIVE_DIR/welcome_dyld_fixture_caller.S" \
  -L "$OUT_DIR" -lspdlog.1.13 -lwelcome_fixture_support

"${COMMON[@]}" -dynamiclib -Wl,-bind_at_load -Wl,-twolevel_namespace \
  -Wl,-install_name,@rpath/libwelcome_fixture_interposer.dylib \
  -Wl,-rpath,@loader_path -DWELCOME_LOG_IT_FIXTURE=1 \
  -o "$OUT_DIR/libwelcome_fixture_interposer.dylib" \
  "$NATIVE_DIR/welcome_dyld_fixture_interposer.cpp" \
  "$VENEER_SOURCE" \
  -L "$OUT_DIR" \
  -lwelcome_fixture_early_caller -lspdlog.1.13 -lwelcome_fixture_support

"${COMMON[@]}" -Wl,-bind_at_load -Wl,-rpath,@loader_path \
  -o "$OUT_DIR/welcome_dyld_fixture" \
  "$NATIVE_DIR/welcome_dyld_fixture_main.cpp" \
  -L "$OUT_DIR" -lwelcome_fixture_support

ulimit -c 0
set +e
DYLD_BIND_AT_LAUNCH=1 \
DYLD_INSERT_LIBRARIES="$OUT_DIR/libwelcome_fixture_interposer.dylib" \
  "$OUT_DIR/welcome_dyld_fixture"
status=$?
set -e

if [[ "$MODE" == "green" && "$status" -ne 0 ]]; then
  echo "FAIL: fixed veneer fixture exited with status $status" >&2
  exit 1
fi
if [[ "$MODE" == "red" && "$status" -ne 134 ]]; then
  echo "FAIL: unsafe veneer did not fail at missing-original abort (status $status)" >&2
  exit 1
fi
if [[ "$MODE" == "red" ]]; then
  echo "RED CONFIRMED: constructor-time call reaches the unsafe missing-original abort."
fi
