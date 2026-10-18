/**
 * [INPUT]: 依赖macOS CommonCrypto或Windows宿主Qt SHA-256与生成表的实际源摘要。
 * [OUTPUT]: 验证原厂JS字节串与批准摘要完全相等。
 * [POS]: 仅证明读取内容身份；不负责路径、locale或文本投影。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if defined(_WIN32)
#include <QtCore/QCryptographicHash>
#else
#include <CommonCrypto/CommonDigest.h>
#endif
#include <array>
#include <cstring>
#include <limits>
#include <string_view>

namespace native_demo_reader {
inline bool sourceDigestMatches(
    std::string_view source, std::string_view expectedHex) noexcept
{
#if defined(_WIN32)
    if (source.empty() || expectedHex.size() != 64U) return false;
    const auto digest = QCryptographicHash::hash(
        QByteArrayView(source.data(), static_cast<qsizetype>(source.size())), QCryptographicHash::Sha256).toHex();
    return std::memcmp(digest.constData(), expectedHex.data(), 64U) == 0;
#else
    if (source.empty() || source.size() > static_cast<std::size_t>(
            std::numeric_limits<CC_LONG>::max()) || expectedHex.size() != 64U) return false;
    std::array<unsigned char, CC_SHA256_DIGEST_LENGTH> digest{};
    if (CC_SHA256(source.data(), static_cast<CC_LONG>(source.size()), digest.data()) == nullptr)
        return false;
    constexpr char kHex[] = "0123456789abcdef";
    std::array<char, 64> encoded{};
    for (std::size_t index = 0; index < digest.size(); ++index) {
        encoded[index * 2U] = kHex[digest[index] >> 4U];
        encoded[index * 2U + 1U] = kHex[digest[index] & 0x0fU];
    }
    return std::memcmp(encoded.data(), expectedHex.data(), encoded.size()) == 0;
#endif
}
}  // namespace native_demo_reader
