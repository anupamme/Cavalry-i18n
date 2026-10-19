/**
 * [INPUT]: 依赖官方2.8 x86_64 activeLocale导出、调用窗、GOT与stub字节。
 * [OUTPUT]: 锁定getter sret、owner返回PC、调用目标与GOT相对跳转。
 * [POS]: x86 locale静态合同；只准入registerNodesSetup语言快照owner。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#if !defined(__x86_64__)
#error "activeLocale x86_64 ABI contract requires an x86_64 target."
#endif

#include <array>
#include <cstddef>
#include <cstdint>
#include <limits>

namespace native_locale_interpose::x86_64_contract {
inline constexpr char kGetterSymbol[] = "__ZN7cavalry12activeLocaleEP3Api";
inline constexpr char kRegisterNodesSetupSymbol[] = "__Z18registerNodesSetupP3Api";
inline constexpr std::uintptr_t kGetterEntryOffset = 0x21dc0;
inline constexpr std::uintptr_t kRegisterNodesSetupEntryOffset = 0xde9a30;
inline constexpr std::uintptr_t kRegisterNodesSetupCallOffset = 0xdea2e1;
inline constexpr std::uintptr_t kRegisterNodesSetupReturnOffset = 0xdea2e6;
inline constexpr std::uintptr_t kControlCentreCallOffset = 0x70b218;
inline constexpr std::uintptr_t kControlCentreReturnOffset = 0x70b21d;
inline constexpr std::uintptr_t kImportIndex = 0x09be;
inline constexpr std::uintptr_t kStubOffset = 0xf428b5;
inline constexpr std::uintptr_t kGotOffset = 0x11c3df0;
inline constexpr std::size_t kObservedReturnObjectBytes = 24;

inline constexpr std::uintptr_t kGetterSretSaveOffset = 0x21dc9;
inline constexpr std::array<std::uint8_t, 15> kGetterEntryBytes = {
    0x55, 0x48, 0x89, 0xe5, 0x53, 0x48, 0x83, 0xec,
    0x18, 0x48, 0x89, 0xfb, 0x48, 0x8b, 0x06};
inline constexpr std::array<std::uint8_t, 3> kGetterSretSaveBytes = {
    0x48, 0x89, 0xfb};
inline constexpr std::uintptr_t kGetterReturnSretOffset = 0x21e0f;
inline constexpr std::array<std::uint8_t, 3> kGetterReturnSretBytes = {
    0x48, 0x89, 0xd8};
inline constexpr std::array<std::uint8_t, 4> kOwnerSretArgumentBytes = {
    0x48, 0x8d, 0x7d, 0xa0};
inline constexpr std::uintptr_t kOwnerSretArgumentOffset = 0xdea2da;
inline constexpr std::uintptr_t kOwnerApiArgumentOffset = 0xdea2de;
inline constexpr std::array<std::uint8_t, 3> kOwnerApiArgumentBytes = {
    0x4c, 0x89, 0xee};
inline constexpr std::array<std::uint8_t, 5> kOwnerCallBytes = {
    0xe8, 0xcf, 0x85, 0x15, 0x00};
inline constexpr std::uintptr_t kOwnerReturnUseOffset = 0xdea2e6;
inline constexpr std::array<std::uint8_t, 4> kOwnerReturnUseBytes = {
    0x48, 0x8d, 0x75, 0xa0};
inline constexpr std::uintptr_t kOwnerSetLocaleCallOffset = 0xdea2ed;
inline constexpr std::array<std::uint8_t, 5> kOwnerSetLocaleCallBytes = {
    0xe8, 0xb1, 0x61, 0x15, 0x00};
inline constexpr std::array<std::uint8_t, 6> kActiveLocaleStubBytes = {
    0xff, 0x25, 0x35, 0x15, 0x28, 0x00};

constexpr std::uint32_t readU32(const std::array<std::uint8_t, 6> &bytes,
                                std::size_t offset) noexcept
{
    return static_cast<std::uint32_t>(bytes[offset]) |
        (static_cast<std::uint32_t>(bytes[offset + 1U]) << 8U) |
        (static_cast<std::uint32_t>(bytes[offset + 2U]) << 16U) |
        (static_cast<std::uint32_t>(bytes[offset + 3U]) << 24U);
}
constexpr std::int64_t signedRel32(std::uint32_t value) noexcept
{
    return (value & 0x80000000U) != 0
        ? static_cast<std::int64_t>(value) - 0x100000000LL
        : static_cast<std::int64_t>(value);
}

inline bool isRegisterNodesSetupOwnerReturn(
    bool contractReady, std::uintptr_t extensionBase,
    std::uintptr_t callerPc) noexcept
{
    if (!contractReady || extensionBase == 0 ||
        extensionBase > std::numeric_limits<std::uintptr_t>::max() -
            kRegisterNodesSetupReturnOffset) return false;
    return callerPc == extensionBase + kRegisterNodesSetupReturnOffset;
}

static_assert(kRegisterNodesSetupCallOffset + 5 == kRegisterNodesSetupReturnOffset);
static_assert(kRegisterNodesSetupReturnOffset == kOwnerReturnUseOffset);
static_assert(kControlCentreCallOffset + 5 == kControlCentreReturnOffset);
static_assert(kGetterEntryOffset + 9 == kGetterSretSaveOffset);
static_assert(kRegisterNodesSetupCallOffset + kOwnerCallBytes.size() ==
              kRegisterNodesSetupReturnOffset);
static_assert(kObservedReturnObjectBytes == 24);
static_assert(kStubOffset + kActiveLocaleStubBytes.size() +
              signedRel32(readU32(kActiveLocaleStubBytes, 2U)) == kGotOffset);
static_assert(kRegisterNodesSetupCallOffset + kOwnerCallBytes.size() +
              signedRel32(static_cast<std::uint32_t>(kOwnerCallBytes[1]) |
                  (static_cast<std::uint32_t>(kOwnerCallBytes[2]) << 8U) |
                  (static_cast<std::uint32_t>(kOwnerCallBytes[3]) << 16U) |
                  (static_cast<std::uint32_t>(kOwnerCallBytes[4]) << 24U)) == kStubOffset);
}  // namespace native_locale_interpose::x86_64_contract
