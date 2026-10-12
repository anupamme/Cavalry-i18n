/**
 * [INPUT]: 依赖纯帮助策略、arm64 ABI 镜像和合成 call-through target。
 * [OUTPUT]: 验证main/def分表、同名异源隔离、shadow保真及单次异常传播。
 * [POS]: 不加载 Qt、Cavalry 或候选 dylib；测试不构成 runtime consumer 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "help_description_abi_contract.h"
#include "help_description_adapter.inc"
#include "help_description_policy.h"
#include "native_locale_snapshot.h"

#include <cstdio>
#include <stdexcept>
#include <string>
#include <vector>

namespace {
using native_help_description::AddScriptDocumentationEntry;
using native_help_description::HelpDescriptionEntry;
using native_help_description::forwardAddScriptDocumentationEntry;
using Mirror = native_help_description::contract::ScriptDocumentationAbiMirror;
using Locale = cavalry_native_font::Locale;
using LocaleSnapshot = cavalry_native_font::LocaleSnapshot;

struct TargetObservation {
    std::size_t calls = 0;
    void *expectedOwner = nullptr;
    const std::string *expectedKey = nullptr;
    const Mirror *expectedSource = nullptr;
    bool expectTranslated = false;
    bool preserveFields = false;
    bool shouldThrow = false;
    const char *expectedDescription = nullptr;
};

TargetObservation gObservation{};

void syntheticOriginal(
    void *owner,
    const std::string &key,
    const Mirror &documentation)
{
    ++gObservation.calls;
    if (owner != gObservation.expectedOwner || &key != gObservation.expectedKey) {
        gObservation.preserveFields = false;
    }
    const bool isOriginal = &documentation == gObservation.expectedSource;
    if (gObservation.expectTranslated == isOriginal) gObservation.preserveFields = false;
    if (gObservation.expectedDescription != nullptr &&
        documentation.description != gObservation.expectedDescription) {
        gObservation.preserveFields = false;
    }
    if (!isOriginal && gObservation.expectedSource != nullptr) {
        const Mirror &source = *gObservation.expectedSource;
        if (documentation.opaqueString18 != source.opaqueString18 ||
            documentation.opaqueString30 != source.opaqueString30 ||
            documentation.opaqueString48 != source.opaqueString48 ||
            documentation.opaqueStrings60 != source.opaqueStrings60) {
            gObservation.preserveFields = false;
        }
    }
    if (gObservation.shouldThrow) throw std::runtime_error("original sentinel");
}

bool check(bool condition, const char *message)
{
    if (condition) return true;
    std::fprintf(stderr, "FAIL: %s\n", message);
    return false;
}

bool localeProjectionIsDescriptionOnly()
{
    const HelpDescriptionEntry table[] = {
        {"makeBox", "Creates a box.", "创建方盒。", "建立方盒。", "ボックスを作成します。"},
        {"makePlane", "Creates a plane.", "创建平面。", "建立平面。", "平面を作成します。"},
    };
    const auto lookup = [&](std::string_view name, std::string_view source, Locale locale) {
        return native_help_description::approvedDescription(
            table, 2, name, source, locale);
    };
    return check(lookup("makeBox", "Creates a box.", Locale::Hans) == "创建方盒。",
            "Hans translation") &&
        check(lookup("makeBox", "Creates a box.", Locale::Hant) == "建立方盒。",
            "Hant translation") &&
        check(lookup("makeBox", "Creates a box.", Locale::Japanese) == "ボックスを作成します。",
            "Japanese translation") &&
        check(lookup("makeBox", "stale source", Locale::Hans).empty(),
            "source drift pass-through") &&
        check(lookup("unknown", "Creates a box.", Locale::Hans).empty(),
            "unknown name pass-through") &&
        check(lookup("makeBox", "Creates a box.", Locale::English).empty(),
            "English pass-through") &&
        check(lookup("makeBox", "Creates a box.", Locale::Unknown).empty(),
            "unknown locale pass-through") &&
        check(lookup("makeBox", "Creates a box.", Locale::Unset).empty(),
            "unset locale pass-through") &&
        check(lookup("makeBox", "Creates a box.", static_cast<Locale>(0xff)).empty(),
            "invalid locale pass-through");
}

bool shadowCopiesEveryUntranslatedMember()
{
    const Mirror source{
        "Creates a box.",
        "opaque 18",
        "opaque 30",
        "opaque 48",
        {"opaque vector item", "second item"},
    };
    const Mirror shadow = native_help_description::makeDescriptionShadow(
        source, "创建方盒。");
    return check(shadow.description == "创建方盒。", "description replacement") &&
        check(shadow.opaqueString18 == source.opaqueString18, "+0x18 preservation") &&
        check(shadow.opaqueString30 == source.opaqueString30, "+0x30 preservation") &&
        check(shadow.opaqueString48 == source.opaqueString48, "+0x48 preservation") &&
        check(shadow.opaqueStrings60 == source.opaqueStrings60, "+0x60 preservation") &&
        check(source.description == "Creates a box.", "source object unchanged");
}

bool callThroughPreservesCallerOwnerAndKey()
{
    const HelpDescriptionEntry table[] = {
        {"makeBox", "Creates a box.", "创建方盒。", "建立方盒。", "ボックスを作成します。"},
    };
    int ownerStorage = 0;
    void *owner = &ownerStorage;
    const std::string key = "makeBox";
    const Mirror source{"Creates a box.", "a", "b", "c", {"d"}};
    LocaleSnapshot locale{};
    if (!locale.publish("zh-Hans")) return false;

    gObservation = {0, owner, &key, &source, true, true, false, "创建方盒。"};
    forwardAddScriptDocumentationEntry(
        &syntheticOriginal, owner, key, source, 0x1004, 0x1004, 0x2004,
        locale, {table, 1}, {nullptr, 0});
    return check(gObservation.calls == 1, "translated path invokes original once") &&
        check(gObservation.preserveFields, "translated path preserves owner/key/other fields");
}

bool rejectedCallerUsesOriginalObjectOnce()
{
    int ownerStorage = 0;
    void *owner = &ownerStorage;
    const std::string key = "makeBox";
    const Mirror source{"Creates a box.", "a", "b", "c", {"d"}};
    LocaleSnapshot locale{};
    locale.publish("zh-Hans");
    const HelpDescriptionEntry table[] = {
        {"makeBox", "Creates a box.", "创建方盒。", "建立方盒。", "ボックスを作成します。"},
    };
    gObservation = {0, owner, &key, &source, false, true, false};
    forwardAddScriptDocumentationEntry(
        &syntheticOriginal, owner, key, source, 0x3004, 0x1004, 0x2004,
        locale, {table, 1}, {nullptr, 0});
    return check(gObservation.calls == 1, "rejected caller invokes original once") &&
        check(gObservation.preserveFields, "rejected caller preserves original object");
}

bool mainAndDefCallersUseIsolatedTables()
{
    const HelpDescriptionEntry mainEntries[] = {
        {"getBoundingBox", "Returns UI bounds.", "界面边界。", "介面邊界。", "UI境界を返します。"},
    };
    const HelpDescriptionEntry defEntries[] = {
        {"getBoundingBox", "Returns deformer bounds.", "变形器边界。", "變形器邊界。", "デフォーマ境界を返します。"},
    };
    int ownerStorage = 0;
    void *owner = &ownerStorage;
    LocaleSnapshot locale{};
    locale.publish("zh-Hans");
    const auto call = [&](const char *description, std::uintptr_t caller,
                          bool translated, const char *expected) {
        const std::string key = "getBoundingBox";
        const Mirror source{description, "a", "b", "c", {"d"}};
        gObservation = {0, owner, &key, &source, translated, true, false, expected};
        forwardAddScriptDocumentationEntry(
            &syntheticOriginal, owner, key, source, caller, 0x1004, 0x2004,
            locale, {mainEntries, 1}, {defEntries, 1});
        return gObservation.calls == 1 && gObservation.preserveFields;
    };
    return check(call("Returns UI bounds.", 0x1004, true, "界面边界。"),
            "main caller reads only the main root table") &&
        check(call("Returns deformer bounds.", 0x2004, true, "变形器边界。"),
            "def caller reads only the def root table") &&
        check(call("Returns UI bounds.", 0x2004, false, nullptr),
            "same-name source mismatch passes through without cross-table fallback") &&
        check(call("Returns deformer bounds.", 0x3004, false, nullptr),
            "unknown caller cannot use either table");
}

bool unmatchedInputsForwardOriginalOnce()
{
    const HelpDescriptionEntry table[] = {
        {"makeBox", "Creates a box.", "创建方盒。", "建立方盒。", "ボックスを作成します。"},
    };
    int ownerStorage = 0;
    void *owner = &ownerStorage;
    const auto exercise = [&](const char *keyText, const char *descriptionText,
                              const char *localeText) {
        const std::string key = keyText;
        const Mirror source{descriptionText, "a", "b", "c", {"d"}};
        LocaleSnapshot locale{};
        locale.publish(localeText);
        gObservation = {0, owner, &key, &source, false, true, false};
        forwardAddScriptDocumentationEntry(
            &syntheticOriginal, owner, key, source, 0x1004, 0x1004, 0x2004,
            locale, {table, 1}, {nullptr, 0});
        return gObservation.calls == 1 && gObservation.preserveFields;
    };
    return check(exercise("makeBox", "Creates a box.", "en-GB"),
            "English uses original description") &&
        check(exercise("missing", "Creates a box.", "zh-Hans"),
            "unknown key uses original object") &&
        check(exercise("makeBox", "stale source", "zh-Hans"),
            "source drift uses original description") &&
        check(exercise("makeBox", "Creates a box.", "unknown-locale"),
            "unknown locale uses original description");
}

bool originalExceptionPropagatesWithoutRetry()
{
    int ownerStorage = 0;
    void *owner = &ownerStorage;
    const std::string key = "makeBox";
    const Mirror source{"Creates a box.", "a", "b", "c", {"d"}};
    LocaleSnapshot locale{};
    locale.publish("zh-Hans");
    const HelpDescriptionEntry table[] = {
        {"makeBox", "Creates a box.", "创建方盒。", "建立方盒。", "ボックスを作成します。"},
    };
    gObservation = {0, owner, &key, &source, true, true, true};
    try {
        forwardAddScriptDocumentationEntry(
            &syntheticOriginal, owner, key, source, 0x1004, 0x1004, 0x2004,
            locale, {table, 1}, {nullptr, 0});
    } catch (const std::runtime_error &error) {
        return check(std::string(error.what()) == "original sentinel",
                "original exception unchanged") &&
            check(gObservation.calls == 1, "throwing original is not retried") &&
            check(gObservation.preserveFields, "throwing path preserves call identity");
    }
    return check(false, "original exception must propagate");
}
}  // namespace

int main()
{
    if (!localeProjectionIsDescriptionOnly() ||
        !shadowCopiesEveryUntranslatedMember() ||
        !callThroughPreservesCallerOwnerAndKey() ||
        !mainAndDefCallersUseIsolatedTables() ||
        !rejectedCallerUsesOriginalObjectOnce() ||
        !unmatchedInputsForwardOriginalOnce() ||
        !originalExceptionPropagatesWithoutRetry()) return 1;
    std::puts("PASS: help description policy and ABI mirror contract");
    return 0;
}
