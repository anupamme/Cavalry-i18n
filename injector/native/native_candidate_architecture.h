/**
 * [INPUT]: 依赖Cavalry 2.8官方Frameworks各slice的Mach-O UUID记录。
 * [OUTPUT]: 按编译架构选择官方Core、Extension、Skia、API、Qt与辅助库身份。
 * [POS]: 只判定候选目标架构和映像身份；不授权任何函数ABI或运行时hook。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

namespace native_candidate_architecture {

enum class Architecture {
    Arm64,
    X86_64
};

enum class ImageRole {
    Core,
    Extension,
    Skia,
    Api,
    Fmt,
    Spdlog,
    CavalryUi,
    QtCore,
    QtGui,
    QtWidgets
};

#if defined(__arm64__)
inline constexpr Architecture kBuildArchitecture = Architecture::Arm64;
#elif defined(__x86_64__)
inline constexpr Architecture kBuildArchitecture = Architecture::X86_64;
#else
#error "Native candidate supports only arm64 and x86_64 build profiles."
#endif

struct ImageUuids {
    const char *arm64;
    const char *x86_64;
};

constexpr ImageUuids imageUuids(ImageRole role) noexcept
{
    switch (role) {
        case ImageRole::Core:
            return {"55C6FCB7-E0DA-3AC1-8C45-055CC6ECEAD9",
                    "F1CF1469-3FB9-3C2B-B695-3827F32F341A"};
        case ImageRole::Extension:
            return {"448DD50E-75F4-3F2D-A46B-2C9F00DF9408",
                    "DB431633-99A8-3C32-89EF-3378D4B418EA"};
        case ImageRole::Skia:
            return {"E6258D2F-A1BB-3CEE-9DBA-6DB3BA0303D2",
                    "3E709FF2-F798-3456-9282-28F9350B57A7"};
        case ImageRole::Api:
            return {"475E0957-00C1-325C-BC45-58D35DD5EB86",
                    "3184B97D-5CB0-38EC-8A00-A78A7DB1AB90"};
        case ImageRole::Fmt:
            return {"110C9692-B750-3974-85A5-49FCA0FBB0F4",
                    "FA1F1EFC-B742-3367-8E31-A7B878197785"};
        case ImageRole::Spdlog:
            return {"F9429837-12E6-3A4A-8436-97E5257E75EA",
                    "C775F97A-4296-3AAB-8CBC-CE8EA92E2286"};
        case ImageRole::CavalryUi:
            return {"D579B833-98FF-3E13-B79E-624C9D9AA776",
                    "2E9322B5-C7A3-3891-9B33-D0DED802D37D"};
        case ImageRole::QtCore:
            return {"4B36DF00-3C84-3C21-855A-1C9975493A3C",
                    "3A22E432-F63B-344F-8555-EFFC3A9E92AB"};
        case ImageRole::QtGui:
            return {"3786AFD4-5351-3B21-A2DF-06A901C3C6EE",
                    "C5244FEA-136F-3ED0-8F82-85A535F14F2B"};
        case ImageRole::QtWidgets:
            return {"01652E29-047E-3528-9DC2-1BD084292E50",
                    "0C194E6E-1E76-3FD4-83A3-9263616E2F3F"};
    }
    return {nullptr, nullptr};
}

constexpr const char *expectedUuid(ImageRole role, Architecture architecture) noexcept
{
    const ImageUuids pair = imageUuids(role);
    return architecture == Architecture::X86_64 ? pair.x86_64 : pair.arm64;
}

}  // namespace native_candidate_architecture
