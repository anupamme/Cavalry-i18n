/**
 * [INPUT]: 依赖官方UUID表、x86 getter字节合同与语言快照策略。
 * [OUTPUT]: 验证x86 owner返回PC门与单次原getter快照发布。
 * [POS]: vendor-free x86 ABI边界合同；不伪称厂商映像已准入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "native_candidate_architecture.h"
#include "native_locale_x86_64_abi_contract.h"
#include "native_locale_snapshot.h"

#include <cstdio>
#include <cstring>
#include <limits>

using native_candidate_architecture::Architecture;
using native_candidate_architecture::ImageRole;
namespace getter_contract = native_locale_interpose::x86_64_contract;

static_assert(native_candidate_architecture::kBuildArchitecture ==
              Architecture::X86_64);
static_assert(getter_contract::kGetterEntryOffset == 0x21dc0);
static_assert(getter_contract::kRegisterNodesSetupReturnOffset == 0xdea2e6);
static_assert(getter_contract::kImportIndex == 0x09be);
static_assert(getter_contract::kGotOffset == 0x11c3df0);
static_assert(getter_contract::kGetterEntryBytes.size() == 15);
static_assert(getter_contract::kActiveLocaleStubBytes.size() == 6);

namespace {
int gFailures = 0;

void expectUuid(ImageRole role, const char *expected, const char *name)
{
    const char *actual = native_candidate_architecture::expectedUuid(
        role, Architecture::X86_64);
    if (actual == nullptr || std::strcmp(actual, expected) != 0) {
        std::fprintf(stderr, "FAIL: x86_64 %s UUID selection\n", name);
        ++gFailures;
    }
}

bool exactOwnerReturnPcIsRequired()
{
    constexpr std::uintptr_t extensionBase = 0x10000000;
    constexpr std::uintptr_t ownerReturn = extensionBase +
        getter_contract::kRegisterNodesSetupReturnOffset;
    constexpr std::uintptr_t unrelatedReturn = extensionBase +
        getter_contract::kControlCentreReturnOffset;
    return getter_contract::isRegisterNodesSetupOwnerReturn(
               true, extensionBase, ownerReturn) &&
        !getter_contract::isRegisterNodesSetupOwnerReturn(
               false, extensionBase, ownerReturn) &&
        !getter_contract::isRegisterNodesSetupOwnerReturn(
               true, extensionBase, ownerReturn + 1) &&
        !getter_contract::isRegisterNodesSetupOwnerReturn(
               true, extensionBase, unrelatedReturn) &&
        !getter_contract::isRegisterNodesSetupOwnerReturn(
               true, 0, ownerReturn) &&
        !getter_contract::isRegisterNodesSetupOwnerReturn(
               true, std::numeric_limits<std::uintptr_t>::max() -
                   getter_contract::kRegisterNodesSetupReturnOffset + 1,
               ownerReturn);
}

bool ownerForwardsOnceAndPublishesOnlyItsLocale()
{
    constexpr std::uintptr_t extensionBase = 0x20000000;
    constexpr std::uintptr_t ownerReturn = extensionBase +
        getter_contract::kRegisterNodesSetupReturnOffset;
    int calls = 0;
    cavalry_native_font::LocaleSnapshot snapshot{};
    const auto getter = [&calls](int *) {
        ++calls;
        return std::string("zh-Hant");
    };
    const bool exactOwner = getter_contract::isRegisterNodesSetupOwnerReturn(
        true, extensionBase, ownerReturn);
    const std::string result = cavalry_native_font::forwardNativeLocale(
        static_cast<int *>(nullptr), getter, exactOwner, snapshot);
    if (calls != 1 || result != "zh-Hant" ||
        snapshot.value() != cavalry_native_font::Locale::Hant) return false;

    const auto unrelatedGetter = [&calls](int *) {
        ++calls;
        return std::string("ja");
    };
    const bool unrelatedOwner = getter_contract::isRegisterNodesSetupOwnerReturn(
        true, extensionBase, extensionBase +
            getter_contract::kControlCentreReturnOffset);
    const std::string unrelated = cavalry_native_font::forwardNativeLocale(
        static_cast<int *>(nullptr), unrelatedGetter, unrelatedOwner, snapshot);
    return calls == 2 && unrelated == "ja" &&
        snapshot.value() == cavalry_native_font::Locale::Hant;
}
}  // namespace

int main()
{
    expectUuid(ImageRole::Core, "F1CF1469-3FB9-3C2B-B695-3827F32F341A", "Core");
    expectUuid(ImageRole::Extension, "DB431633-99A8-3C32-89EF-3378D4B418EA", "Extension");
    expectUuid(ImageRole::Skia, "3E709FF2-F798-3456-9282-28F9350B57A7", "Skia");
    expectUuid(ImageRole::Api, "3184B97D-5CB0-38EC-8A00-A78A7DB1AB90", "API");
    expectUuid(ImageRole::Fmt, "FA1F1EFC-B742-3367-8E31-A7B878197785", "fmt");
    expectUuid(ImageRole::Spdlog, "C775F97A-4296-3AAB-8CBC-CE8EA92E2286", "spdlog");
    expectUuid(ImageRole::CavalryUi, "2E9322B5-C7A3-3891-9B33-D0DED802D37D", "CavalryUI");
    expectUuid(ImageRole::QtCore, "3A22E432-F63B-344F-8555-EFFC3A9E92AB", "QtCore");
    expectUuid(ImageRole::QtGui, "C5244FEA-136F-3ED0-8F82-85A535F14F2B", "QtGui");
    expectUuid(ImageRole::QtWidgets, "0C194E6E-1E76-3FD4-83A3-9263616E2F3F", "QtWidgets");
    if (!exactOwnerReturnPcIsRequired()) {
        std::fprintf(stderr, "FAIL: x86 locale snapshot requires exact ready owner return PC\n");
        ++gFailures;
    }
    if (!ownerForwardsOnceAndPublishesOnlyItsLocale()) {
        std::fprintf(stderr, "FAIL: x86 locale owner forwards once and preserves nonowner state\n");
        ++gFailures;
    }
    if (gFailures != 0) return 1;
    std::puts("PASS: x86_64 UUIDs, exact getter owner, and single-forward locale snapshot");
    return 0;
}
