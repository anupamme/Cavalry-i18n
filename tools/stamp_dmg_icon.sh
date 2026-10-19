#!/bin/bash
set -euo pipefail

# [INPUT]: 依赖磁盘上的架构后缀 DMG、dmg_volume_identity.js、package.json、icon.icns、hdiutil、diskutil、Rez 与 SetFile
# [OUTPUT]: 写入卷标及卷宗图标的 DMG；忙卷有界等待，失败保留诊断与仍挂载的 backing 镜像
# [POS]: tools/ 下的 DMG 身份与卷宗图标 producer，本地构建和 CI 发布共同调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

DIST_DIR="${1:-dist}"
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd -P)
ICNS="$REPO_ROOT/src-tauri/icons/icon.icns"
VOLUME_IDENTITY_TOOL="$SCRIPT_DIR/dmg_volume_identity.js"
TMPRSRC=""
WORKDIR=""
mount_point=""

# 复用 Tauri bundle_dmg.sh 的边界：仅 EBUSY=16，最多三次，等待 2/4 秒。
detach_volume() {
  local attempt status
  for attempt in 1 2 3; do
    if hdiutil detach "$mount_point"; then
      mount_point=""
      return 0
    else
      status=$?
    fi
    if [ "$status" -ne 16 ] || [ "$attempt" -eq 3 ]; then
      return "$status"
    fi
    echo "DMG volume busy; retrying detach ($attempt/3)." >&2
    sleep $((2 ** attempt))
  done
}

cleanup() {
  local status=$? detach_status
  if [ -n "$mount_point" ]; then
    if hdiutil detach "$mount_point"; then
      mount_point=""
    else
      detach_status=$?
      echo "DMG remains mounted at $mount_point; preserving backing image: $WORKDIR" >&2
      lsof +f -- "$mount_point" >&2 || true
      [ "$status" -ne 0 ] || status=$detach_status
    fi
  fi
  if [ -n "$TMPRSRC" ]; then
    rm -f "$TMPRSRC"
  fi
  if [ -n "$WORKDIR" ] && [ -z "$mount_point" ]; then
    rm -rf "$WORKDIR"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'status=$?; echo "DMG processing failed at line $LINENO (exit $status)." >&2' ERR

# 1. 检查基础资源
if [ ! -f "$ICNS" ]; then
  echo "Icon not found: $ICNS" >&2
  exit 1
fi

# 2. 准备图标资源 (DeRez/Rez 逻辑)
TMPRSRC=$(mktemp /tmp/dmg-icon-XXXXXX.rsrc)

sips -i "$ICNS" >/dev/null 2>&1
DeRez -only icns "$ICNS" > "$TMPRSRC"

found=0
for dmg in "$DIST_DIR"/*.dmg; do
  [ -f "$dmg" ] || continue
  echo "Processing $(basename "$dmg")..."

  # 卷宗图标：写进 DMG 文件系统本体，GitHub 裸 .dmg 下载后仍保留。
  WORKDIR=$(mktemp -d /tmp/dmg-volume-icon-XXXXXX)
  rw_dmg="$WORKDIR/readwrite.dmg"
  final_dmg="$WORKDIR/final.dmg"
  volume_name=$(node "$VOLUME_IDENTITY_TOOL" --dmg "$dmg")

  hdiutil convert "$dmg" -format UDRW -o "$rw_dmg"
  attach_output=$(hdiutil attach "$rw_dmg" -readwrite -nobrowse -noverify -noautoopen)
  mount_line=$(printf '%s\n' "$attach_output" | awk '/\/Volumes\// { print; exit }')
  device_name=$(printf '%s\n' "$mount_line" | awk '{ print $1 }')
  mount_point=$(printf '%s\n' "$mount_line" | awk '{ print substr($0, index($0, "/Volumes/")) }')
  if [ -z "$mount_point" ] || [ ! -d "$mount_point" ]; then
    echo "Unable to mount writable DMG: $dmg" >&2
    exit 1
  fi

  /usr/sbin/diskutil rename "$device_name" "$volume_name" >/dev/null
  renamed_mount_point=$(
    /usr/sbin/diskutil info "$device_name" |
      awk -F: '/Mount Point/ { sub(/^[[:space:]]+/, "", $2); print $2; exit }'
  )
  actual_volume_name=$(
    /usr/sbin/diskutil info "$device_name" |
      awk -F: '/Volume Name/ { sub(/^[[:space:]]+/, "", $2); print $2; exit }'
  )
  if [ "$actual_volume_name" != "$volume_name" ] || [ -z "$renamed_mount_point" ] || [ ! -d "$renamed_mount_point" ]; then
    echo "Unable to set DMG volume title to '$volume_name': $dmg" >&2
    exit 1
  fi
  mount_point="$renamed_mount_point"
  echo "  - Set mounted volume title: $volume_name"

  cp "$ICNS" "$mount_point/.VolumeIcon.icns"
  SetFile -a C "$mount_point"
  SetFile -a V "$mount_point/.VolumeIcon.icns" || true
  detach_volume

  hdiutil convert "$rw_dmg" -format UDZO -imagekey zlib-level=9 -o "$final_dmg"
  mv "$final_dmg" "$dmg"
  echo "  - Embedded DMG volume icon (Success)"

  # 文件图标：只对当前 Mac 文件系统 best-effort 生效，GitHub 上传不承诺保留。
  # Tauri 原生 DMG 配置已处理背景图、窗口尺寸与图标坐标
  # (tauri.conf.json > bundle > macOS > dmg)，
  # 此处仅补充 Tauri 不支持的 Finder 文件图标资源分叉。
  Rez -append "$TMPRSRC" -o "$dmg"
  SetFile -a C "$dmg"
  echo "  - Stamped local Finder file icon (Best effort)"

  rm -rf "$WORKDIR"
  WORKDIR=""
  found=1
done

if [ "$found" -eq 0 ]; then
  echo "No DMG files found in $DIST_DIR" >&2
  exit 1
fi

echo "DMG processing complete!"
