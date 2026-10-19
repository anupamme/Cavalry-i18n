/**
 * [INPUT]: 依赖共享 UTF-8、完整字形策略与有界候选解析器。
 * [OUTPUT]: 按顺序选择首个完整覆盖文本的 face。
 * [POS]: 纯字体策略；解析失败即停，覆盖失败才继续。不证明调用点或 owner。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "timeline_system_fallback_policy.h"
namespace viewport_font {
namespace policy=timeline_system_fallback::policy;
using policy::GlyphLookup;
using policy::Locale;
using policy::TextDisposition;
inline constexpr std::size_t kMaxVerifiedTextCandidates=4;
inline constexpr std::size_t kNamedFallbackPostScriptNameCount=3;

inline const char *namedFallbackPostScriptName(Locale locale,std::size_t index) noexcept {
    if(index>=kNamedFallbackPostScriptNameCount) return nullptr;
    static constexpr const char *kHans[]={"PingFangSC-Regular","PingFangTC-Regular","HiraginoSans-W3"};
    static constexpr const char *kHant[]={"PingFangTC-Regular","PingFangSC-Regular","HiraginoSans-W3"};
    static constexpr const char *kJapanese[]={"HiraginoSans-W3","PingFangTC-Regular","PingFangSC-Regular"};
    switch(locale) {
    case Locale::Hans: return kHans[index];
    case Locale::Hant: return kHant[index];
    case Locale::Japanese: return kJapanese[index];
    default: return nullptr;
    }
}

template<class Resolve>
const void *selectVerifiedTextCandidates(const void *originalTypeface,const void *text,
 std::size_t length,int encoding,GlyphLookup glyph,std::size_t candidateCount,
 Resolve resolve,TextDisposition *out,std::size_t *selectedIndex) noexcept {
    if(selectedIndex!=nullptr) *selectedIndex=candidateCount;
    const auto disposition=policy::classifyText(originalTypeface,text,length,encoding,glyph);
    if(out!=nullptr) *out=disposition;
    if(disposition!=TextDisposition::NeedsSystemFallback ||
       candidateCount>kMaxVerifiedTextCandidates) return originalTypeface;
    for(std::size_t index=0;index<candidateCount;++index) {
        const void *candidate=resolve(index);
        if(candidate==nullptr) break;
        if(policy::selectWholeSpan(originalTypeface,candidate,text,length,encoding,glyph)==candidate &&
           candidate!=originalTypeface) {
            if(selectedIndex!=nullptr) *selectedIndex=index;
            return candidate;
        }
    }
    return originalTypeface;
}

template<class Resolve>
const void *selectVerifiedText(const void *originalTypeface,const void *text,
 std::size_t length,int encoding,GlyphLookup glyph,Resolve resolve,
 TextDisposition *out) noexcept {
    return selectVerifiedTextCandidates(originalTypeface,text,length,encoding,glyph,1,
        [&](std::size_t) noexcept { return resolve(); },out,nullptr);
}
}
