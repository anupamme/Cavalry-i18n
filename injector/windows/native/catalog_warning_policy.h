/*
 * [INPUT]: 同版批准包摘要、17个官方catalog身份、已核宿主根与完整日志payload。
 * [OUTPUT]: 只识别所选非英语locale下的官方target-sidecar探测告警；不匹配英语源、未知插件或近似消息。
 * [POS]: Windows native启动日志的纯策略；不读文件、不修改locale或翻译registry。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>
namespace native_windows_catalog_warning {
struct PackProof {
    std::string_view language,locale,sha256;
    std::uint64_t bytes;
};
inline constexpr std::string_view kPrefix="No translation file at ";
inline constexpr std::string_view kSuffix=", falling back to the source locale";
inline std::string normalized(std::string_view path){
    std::string value(path);
    for(auto &c:value)if(c=='\\')c='/';
    return value;
}
inline bool expectedWarning(std::string_view payload,std::string_view root,const PackProof &proof,
                            const std::string_view *catalogs,std::size_t count){
    if(!((proof.language=="zh-Hans" && proof.locale=="zh-Hans") ||
         (proof.language=="zh-Hant" && proof.locale=="zh-Hant") ||
         (proof.language=="ja_JP" && proof.locale=="ja")) || root.empty() || count!=17)return false;
    if(payload.size()<=kPrefix.size()+kSuffix.size() || payload.substr(0,kPrefix.size())!=kPrefix ||
       payload.substr(payload.size()-kSuffix.size())!=kSuffix)return false;
    const auto path=normalized(payload.substr(kPrefix.size(),payload.size()-kPrefix.size()-kSuffix.size()));
    auto base=normalized(root);
    if(base.back()=='/')base.pop_back();
    base+="/assets/";
    if(path.compare(0,base.size(),base)!=0)return false;
    const auto relative=std::string_view(path).substr(base.size());
    const auto ending="_"+std::string(proof.locale)+".translation.json";
    for(std::size_t i=0;i<count;++i){
        const auto catalog=catalogs[i];
        if(relative.size()==catalog.size()+ending.size() && relative.substr(0,catalog.size())==catalog &&
           relative.substr(catalog.size())==ending)return true;
    }
    return false;
}
}
