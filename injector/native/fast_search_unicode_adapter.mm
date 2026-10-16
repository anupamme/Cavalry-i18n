/**
 * [INPUT]: 依赖Qt 6.9.2 C1及可执行文件推导的同bundle映像和Fast ABI合同。
 * [OUTPUT]: 仅为精确Fast正则构造传递Unicode属性选项。
 * [POS]: 仅在目标ABI逐字节匹配后改写正则选项；x86字节门仍未获准。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if !defined(__arm64__) && !defined(__x86_64__)
#error "Fast Unicode adapter supports only verified macOS target architectures."
#endif

#if defined(__arm64__)
#include <arm_acle.h>
#endif
#include <QtCore/QRegularExpression>
#include <QtCore/QString>
#include <QtCore/qglobal.h>

#include "../cavalry_i18n_macos_abi.h"
#include "fast_search_unicode_abi_contract.h"
#include "fast_search_unicode_policy.h"
#include "native_image_paths.h"

#include <array>
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <mach-o/dyld.h>
#include <pthread.h>

static_assert(QT_VERSION == QT_VERSION_CHECK(6, 9, 2));
static_assert(sizeof(QRegularExpression::PatternOptions) == sizeof(int));
static_assert(QRegularExpression::NoPatternOption ==
              native_fast_search::abi::kNoPatternOption);
static_assert(QRegularExpression::UseUnicodePropertiesOption ==
              native_fast_search::abi::kUnicodePropertiesOption);

extern "C" void qRegularExpressionConstructorTarget(
    QRegularExpression *, const QString &,
    QRegularExpression::PatternOptions)
    __asm__("__ZN18QRegularExpressionC1ERK7QString6QFlagsINS_13PatternOptionEE");
extern "C" void fastSearchUnicodeConstructorInterpose(
    QRegularExpression *, const QString &,
    QRegularExpression::PatternOptions);

namespace {
using cavalry_i18n::macos_abi::LoadedImage;
using native_fast_search::abi::kCallBytes;
using native_fast_search::abi::kCallOffset;
using native_fast_search::abi::kConstructorOffset;
using native_fast_search::abi::kConstructorSymbol;
using native_fast_search::abi::kExtensionUuid;
using native_fast_search::abi::kImportStubOffset;
using native_fast_search::abi::kOptionsBytes;
using native_fast_search::abi::kOptionsOffset;
using native_fast_search::abi::kQtVersion;
using native_fast_search::abi::kReturnOffset;
using Constructor = void (*)(QRegularExpression *, const QString &,
                             QRegularExpression::PatternOptions);

std::atomic<Constructor> gOriginal{nullptr};
std::atomic<bool> gAdmitted{false};
std::atomic<std::uintptr_t> gExpectedReturn{0};
pthread_once_t gInitializeOnce = PTHREAD_ONCE_INIT;

bool findImageAtPath(const char *expectedPath, LoadedImage *output) noexcept
{
    if (expectedPath == nullptr || output == nullptr) return false;
    LoadedImage match{};
    bool found = false;
    for (std::uint32_t index = 0; index < _dyld_image_count(); ++index) {
        const char *path = _dyld_get_image_name(index);
        if (!native_image_paths::pathMatchesCanonical(path, expectedPath)) continue;
        if (found || !cavalry_i18n::macos_abi::loadImageMetadata(
                _dyld_get_image_header(index),
                _dyld_get_image_vmaddr_slide(index), path, &match)) return false;
        found = true;
    }
    if (!found) return false;
    *output = match;
    return true;
}

bool callTargetsImportStub(const LoadedImage &extension) noexcept
{
    std::uint32_t instruction = 0;
    const auto callAddress = cavalry_i18n::macos_abi::imageAddress(
        extension, kCallOffset);
    std::memcpy(&instruction, callAddress, sizeof(instruction));
    if ((instruction & 0xfc000000U) != 0x94000000U) return false;
    std::int64_t immediate = static_cast<std::int64_t>(instruction & 0x03ffffffU);
    if ((immediate & 0x02000000LL) != 0) immediate -= 0x04000000LL;
    const auto target = reinterpret_cast<std::intptr_t>(callAddress) + immediate * 4;
    return target == reinterpret_cast<std::intptr_t>(
        cavalry_i18n::macos_abi::imageAddress(extension, kImportStubOffset));
}

bool expectedFrameworkPath(const char *executable, const char *leaf,
                           char *output, std::size_t capacity) noexcept
{
    return native_image_paths::frameworksPathForExecutable(
        executable, leaf, output, capacity);
}

bool initializeFastSearch() noexcept
{
    gOriginal.store(&qRegularExpressionConstructorTarget,
                    std::memory_order_release);

    char executable[PATH_MAX]{};
    std::uint32_t executableSize = sizeof(executable);
    if (_NSGetExecutablePath(executable, &executableSize) != 0) return false;
    char canonicalExecutable[PATH_MAX]{};
    if (::realpath(executable, canonicalExecutable) == nullptr) return false;
    std::array<char, PATH_MAX> extensionPath{};
    std::array<char, PATH_MAX> qtCoreFrameworkPath{};
    std::array<char, PATH_MAX> qtCorePath{};
    if (!expectedFrameworkPath(canonicalExecutable, "QtCore.framework",
                               qtCoreFrameworkPath.data(),
                               qtCoreFrameworkPath.size())) return false;
    const int qtCorePathSize = std::snprintf(
        qtCorePath.data(), qtCorePath.size(), "%s/Versions/A/QtCore",
        qtCoreFrameworkPath.data());
    if (qtCorePathSize <= 0 ||
        static_cast<std::size_t>(qtCorePathSize) >= qtCorePath.size()) return false;

    LoadedImage qtCore{};
    if (!findImageAtPath(qtCorePath.data(), &qtCore)) return false;

    void *constructor = cavalry_i18n::macos_abi::findMachOSymbol(
        qtCore, kConstructorSymbol);
    if (constructor != nullptr)
        gOriginal.store(reinterpret_cast<Constructor>(constructor),
                        std::memory_order_release);
    const char *runtimeVersion = qVersion();
    if (constructor == nullptr || constructor !=
        cavalry_i18n::macos_abi::imageAddress(qtCore, kConstructorOffset) ||
        runtimeVersion == nullptr ||
        std::strcmp(runtimeVersion, kQtVersion) != 0) return false;

    const char *leaf = std::strrchr(canonicalExecutable, '/');
    if (leaf == nullptr || std::strcmp(leaf + 1, "Cavalry") != 0 ||
        !expectedFrameworkPath(canonicalExecutable, "libExtensionLayer.dylib",
                               extensionPath.data(), extensionPath.size())) return false;

    LoadedImage extension{};
    if (!findImageAtPath(extensionPath.data(), &extension)) return false;
    const bool callMatches =
        cavalry_i18n::macos_abi::imageUuidEquals(extension, kExtensionUuid) &&
        cavalry_i18n::macos_abi::matchesCode(
            extension, kOptionsOffset, kOptionsBytes) &&
        cavalry_i18n::macos_abi::matchesCode(
            extension, kCallOffset, kCallBytes) &&
        callTargetsImportStub(extension);
    if (!callMatches) return false;

    gExpectedReturn.store(reinterpret_cast<std::uintptr_t>(
        cavalry_i18n::macos_abi::imageAddress(extension, kReturnOffset)),
        std::memory_order_release);
    return true;
}

void initializeOnce() noexcept
{
    gAdmitted.store(initializeFastSearch(), std::memory_order_release);
}

void ensureInitialized() noexcept
{
    (void)::pthread_once(&gInitializeOnce, initializeOnce);
}

__attribute__((used)) static struct {
    const void *replacement;
    const void *replacee;
} fastSearchConstructorInterpose __attribute__((section("__DATA,__interpose"))) = {
    reinterpret_cast<const void *>(fastSearchUnicodeConstructorInterpose),
    reinterpret_cast<const void *>(qRegularExpressionConstructorTarget)
};
}  // namespace

extern "C" void fastSearchUnicodeConstructorInterpose(
    QRegularExpression *self, const QString &pattern,
    QRegularExpression::PatternOptions options)
{
    ensureInitialized();
    Constructor original = gOriginal.load(std::memory_order_acquire);
    if (original == nullptr) original = &qRegularExpressionConstructorTarget;

    const auto returnAddress = reinterpret_cast<std::uintptr_t>(
        __builtin_return_address(0));
    const bool useUnicodeProperties = native_fast_search::policy::eligible(
        gAdmitted.load(std::memory_order_acquire), returnAddress,
        gExpectedReturn.load(std::memory_order_acquire), options.toInt(),
        [&pattern]() noexcept {
            return pattern == QStringLiteral("[\\s\\-_\\W]");
        });
    const auto unicodeOptions = QRegularExpression::PatternOptions(
        QRegularExpression::UseUnicodePropertiesOption);
    native_fast_search::policy::forwardOriginal(
        original, self, pattern, options, useUnicodeProperties, unicodeOptions);
}

__attribute__((constructor)) static void initializeFastSearchAtLoad() noexcept
{
    ensureInitialized();
}
