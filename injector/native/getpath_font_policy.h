/**
 * [INPUT]: 依赖native GetPath owner、locale标签、共享UTF-8策略与固定文本lane。
 * [OUTPUT]: 提供owner枚举、512字节边界、exactText与FPS前缀门。
 * [POS]: GetPath静态匹配策略；不保存locale状态或字体descriptor。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "../cavalry_i18n_macos_timeline_font_policy.h"
#include "getpath_font_abi_contract.h"
#include "native_locale_snapshot.h"
#include <cstddef>
#include <cstdint>
#include <cstring>

namespace native_getpath_font {
enum class Owner : std::uint8_t { Unknown, ToolHelp, ViewportStatus, ViewportFps };
struct TextEntry { Owner owner; const char *text; };
inline constexpr std::size_t kEntriesPerLocale = 31;
inline constexpr std::size_t kMaxTextBytes = 512;

inline Owner pathOwner(std::uintptr_t coreReturn, std::uintptr_t cacheReturn,
                       std::uintptr_t producerReturn) noexcept {
    using namespace native_getpath_abi::contract;
    if (coreReturn != kCoreOwnerReturnOffset ||
        cacheReturn != kCacheOwnerReturnOffset) return Owner::Unknown;
    if (producerReturn == kToolHelpProducerReturnA ||
        producerReturn == kToolHelpProducerReturnB) return Owner::ToolHelp;
    if (producerReturn == kViewportStatusProducerReturn) return Owner::ViewportStatus;
    return Owner::Unknown;
}

inline int exactText(const void *text, std::size_t size, int encoding, Owner owner,
                     const TextEntry *entries, std::size_t count) noexcept {
    if (!text || !size || size > kMaxTextBytes || encoding != 0 || owner == Owner::Unknown ||
        !entries || count != kEntriesPerLocale) return -1;
    for (std::size_t i = 0; i < count; ++i) {
        if (entries[i].owner == owner && entries[i].text &&
            size == std::strlen(entries[i].text) &&
            std::memcmp(text, entries[i].text, size) == 0) return static_cast<int>(i);
    }
    return -1;
}

inline const char *viewportFpsPrefix(cavalry_native_font::Locale locale) noexcept {
    switch (locale) {
        case cavalry_native_font::Locale::Hans: return "帧率：";
        case cavalry_native_font::Locale::Hant: return "幀率：";
        case cavalry_native_font::Locale::Japanese: return "フレームレート: ";
        case cavalry_native_font::Locale::Unset:
        case cavalry_native_font::Locale::English:
        case cavalry_native_font::Locale::Unknown: return nullptr;
    }
    return nullptr;
}

inline bool viewportFpsText(const void *text, std::size_t size, int encoding,
                            Owner owner, const char *prefix) noexcept {
    if (!text || !size || size > kMaxTextBytes || encoding != 0 ||
        owner != Owner::ViewportFps || !prefix) return false;
    const std::size_t prefixSize = std::strlen(prefix);
    return prefixSize != 0 && size > prefixSize &&
        std::memcmp(text, prefix, prefixSize) == 0;
}
} // namespace native_getpath_font
