/*
 * [INPUT]: 官方2.8同根Core/Extension/Api/skia/fmt/UI/Qt/spdlog、原厂locale及共享显示策略、Windows Alt字体准入薄层和CAS。
 * [OUTPUT]: 固定状态/Graph/Timeline/Viewport字体与窄UI投影；Demo/Welcome保留已证边界，Api仅对批准包实际存在时的17目录预期探测warning降噪。
 * [POS]: Windows2.8窄补充；固定3个系统face进程期持有，不改模型/认证/profile；显示热路径无IO，精确启动warning才有界核用户包。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "runtime.h"
#include <windows.h>
#include <intrin.h>
#include <shlobj.h>
#include <QtCore/QCoreApplication>
#include <QtCore/QCryptographicHash>
#include <QtCore/QFile>
#include <QtCore/QFileInfo>
#include <QtWidgets/QFileDialog>
#include <array>
#include <atomic>
#include <cstring>
#include <string>
#include "../../native/getpath_font_policy.h"
#include "../../native/getpath_font_texts.inc"
#include "tool_help_font_policy.h"
#include "../../native/getpath_graph_editor_empty_texts.inc"
#include "../../native/save_scene_caption_policy.h"
#include "../../native/verified_text_selection.h"
#include "../cavalry_i18n_iat_patch.h"
#include "title_adapter.h"
#include "viewport_snapshot.h"
#include "help_adapter.h"
#include NATIVE_HELP_DESCRIPTION_TABLE
#include "../../native/help_popup_layout_policy.h"
#include NATIVE_HELP_LAYOUT_ROWS
#include "../../native/guide_body_policy.h"
#include <QtWidgets/QTextEdit>
#include <QtCore/QRegularExpression>
#include <QtGui/QAction>
#include "../../native/easing_menu_policy.h"
#include "../../native/fast_search_unicode_policy.h"
#include NATIVE_EASING_DISPLAY_TABLE
#include "demo_adapter.h"
#include "welcome_adapter.h"
#include "catalog_warning_adapter.h"
#include "catalog_warning_pack.h"
namespace native_windows_catalog_warning {
#include NATIVE_CATALOG_WARNING_GUARD
}
namespace native_demo_reader {
#include NATIVE_DEMO_READER_TEXTS_TABLE
#include NATIVE_DEMO_READER_FILES_TABLE
static_assert(std::size(kDemoReaderTexts)==297 && std::size(kDemoReaderSlots)==489 && std::size(kDemoReaderFiles)==100);
}

namespace {
using NativeGetPathFunction=void(__fastcall*)(const void*,std::size_t,int,float,float,const void*,void*);
using DefaultManager=void*(__fastcall*)(void**);
using MatchFamily=void*(__fastcall*)(const void*,void**,const char*,const std::uint32_t*);
using Glyph=std::uint16_t(__fastcall*)(const void*,std::int32_t);
using ActiveLocale=std::string*(__fastcall*)(std::string*,void*);
using TitleFormat=std::string*(__fastcall*)(std::string*,const native_windows_title::View*,const native_windows_title::Arguments*);
using NativeMeasureFunction=float(__fastcall*)(const void*,const void*,std::size_t,int,void*,const void*);
using NativeDrawFunction=void(__fastcall*)(void*,const void*,std::size_t,int,float,float,const void*,const void*);
using NativeBlobFunction=void*(__fastcall*)(void**,const void*,std::size_t,const void*,int);
using SaveDialogFunction=decltype(&QFileDialog::getSaveFileName);
using FastConstructor=QRegularExpression*(*)(QRegularExpression*,const QString&,QRegularExpression::PatternOptions);
static_assert(sizeof(QRegularExpression::PatternOptions)==4 && int(QRegularExpression::UseUnicodePropertiesOption)==native_fast_search::abi::kUnicodePropertiesOption);
struct State {
    NativeGetPathFunction original=nullptr;Glyph glyph=nullptr;ActiveLocale localeOriginal=nullptr;
    TitleFormat titleOriginal=nullptr;
    SaveDialogFunction saveOriginal=nullptr;
    native_windows_help::Original helpOriginal=nullptr;
    bool (*layoutOriginal)(QLayout*)=nullptr;
    void (*guideOriginal)(QTextEdit*,const QString&)=nullptr;
    void (*easingOriginal)(QWidget*,QAction*)=nullptr;
    FastConstructor fastOriginal=nullptr;
    native_windows_demo::Original demoOriginal=nullptr;
    native_windows_welcome::Original welcomeOriginal=nullptr;
    native_windows_catalog_warning::Original catalogWarningOriginal=nullptr;
    const native_windows_catalog_warning::PackProof *catalogPack=nullptr;
    QByteArray installRootUtf8;
    QString catalogStrings;
    QString presetRoot;
    NativeMeasureFunction measureOriginal=nullptr;NativeDrawFunction drawOriginal=nullptr;NativeBlobFunction blobOriginal=nullptr;
    std::uintptr_t core=0,extension=0,ui=0,api=0;
    std::array<void*,3> faces{};
    std::size_t faceCount=0;
    cavalry_native_font::LocaleSnapshot locale;
    std::array<std::atomic<std::uint64_t>,31> stats{};
};
State *g=nullptr;
void bump(std::size_t n){g->stats[n].fetch_add(1,std::memory_order_relaxed);}
const native_getpath_font::TextEntry *lane(){
    using cavalry_native_font::Locale;
    switch(g->locale.value()){
    case Locale::Hans:return native_getpath_font::kZhHansEntries;
    case Locale::Hant:return native_getpath_font::kZhHantEntries;
    case Locale::Japanese:return native_getpath_font::kJaJpEntries;
    default:return nullptr;
    }
}
enum class PathOwner {Unknown,ToolHelp,ViewportStatus,ViewportFps,RestrictedMode,ActiveCamera,GraphEmpty};
PathOwner ownerChain(){
    void *frames[12]{};const auto count=CaptureStackBackTrace(0,12,frames,nullptr);
    bool core=false,cache=false;
    for(unsigned i=0;i<count;++i){const auto pc=reinterpret_cast<std::uintptr_t>(frames[i]);
        if(pc==g->core+0xd2ac3)core=true;
        else if(core && pc==g->extension+0x4096b0)cache=true;
        else if(cache && (pc==g->extension+0x3f5843 || pc==g->extension+0x3f5856))return PathOwner::ToolHelp;
        else if(cache && pc==g->extension+0x3fc45a)return PathOwner::ViewportStatus;
        else if(cache && pc==g->extension+0x3fcb83)return PathOwner::RestrictedMode;
        else if(cache && pc==g->extension+0x3fbd90)return PathOwner::ActiveCamera;
        else if(core && !cache && (pc==g->extension+0x3fbaea || pc==g->extension+0x3fc700))return PathOwner::ViewportFps;
        else if(core && !cache && pc==g->extension+0x9f5a7c)return PathOwner::GraphEmpty;
    }return PathOwner::Unknown;
}
bool approvedPathText(const void *text,std::size_t length,int encoding,PathOwner owner){
    using Owner=native_getpath_font::Owner;
    if(owner==PathOwner::GraphEmpty)
        return native_getpath_font::exactGraphEditorEmptyText(text,length,encoding,Owner::GraphEditorEmptyState,native_getpath_font::graphEditorEmptyTextEntry(g->locale.value()));
    if(owner==PathOwner::ToolHelp)
        return native_windows_tool_help::approvedText(text,length,encoding,lane());
    if(owner==PathOwner::ViewportStatus)
        return native_getpath_font::exactText(text,length,encoding,Owner::ViewportStatus,lane(),75)>=0;
    if(owner==PathOwner::ViewportFps)
        return native_getpath_font::viewportFpsText(text,length,encoding,Owner::ViewportFps,native_getpath_font::viewportFpsPrefix(g->locale.value()));
    // remaining_global_ui_06中两个原厂固定状态；只修字形，不替换原厂已经翻译的字节。
    const char *restricted=nullptr,*camera=nullptr;
    switch(g->locale.value()){
    case cavalry_native_font::Locale::Hans:restricted="受限模式：检测到专业版功能";camera="当前摄像机：图层工具已禁用。";break;
    case cavalry_native_font::Locale::Hant:restricted="受限模式：偵測到專業版功能";camera="使用中的攝影機：圖層工具已停用。";break;
    case cavalry_native_font::Locale::Japanese:restricted="制限モード：プロフェッショナル機能が検出されました";camera="アクティブカメラ: レイヤーツールは無効です。";break;
    default:return false;
    }
    const auto *expected=owner==PathOwner::RestrictedMode?restricted:owner==PathOwner::ActiveCamera?camera:nullptr;
    return expected && encoding==0 && text && length==std::strlen(expected) && std::memcmp(text,expected,length)==0;
}
__declspec(noinline) std::string *__fastcall localeHook(std::string *output,void *api){
    auto *result=g->localeOriginal(output,api);
    // registerNodesSetup同构入口；不借偏好UI另一个activeLocale caller授予语言。
    if(_ReturnAddress()==reinterpret_cast<void*>(g->extension+0x16114fd) && result==output && output->size()<=16){
        g->locale.publish(std::string_view(output->data(),output->size()));bump(5);
    }
    return result;
}
const void *displayFont(const void *text,std::size_t length,int encoding,const void *font,std::array<std::byte,24> &copy){
    if(!font || !lane())return font;
    void *originalFace=nullptr;std::memcpy(&originalFace,font,sizeof(originalFace));
    viewport_font::policy::TextDisposition disposition;
    const auto face=viewport_font::selectVerifiedTextCandidates(originalFace,text,length,encoding,g->glyph,g->faceCount,[&](std::size_t i){return g->faces[i];},&disposition,nullptr);
    if(!face || face==originalFace)return font;
    std::memcpy(copy.data(),font,copy.size());std::memcpy(copy.data(),&face,sizeof(face));return copy.data();
}
__declspec(noinline) void __fastcall pathHook(const void *text,std::size_t length,int encoding,float x,float y,const void *font,void *path){
    bump(0);const void *selected=font;std::array<std::byte,24> copy{};
    if(_ReturnAddress()==reinterpret_cast<void*>(g->core+0xd2ac3)){
        PathOwner expected=PathOwner::Unknown;
        // 先筛已批准的固定文本，未知用户文本不抓栈、不解析字体。
        for(auto owner:{PathOwner::ToolHelp,PathOwner::ViewportStatus,PathOwner::ViewportFps,PathOwner::RestrictedMode,PathOwner::ActiveCamera,PathOwner::GraphEmpty})
            if(approvedPathText(text,length,encoding,owner)){expected=owner;break;}
        if(expected!=PathOwner::Unknown && ownerChain()==expected){
            bump(1);bump(2);selected=displayFont(text,length,encoding,font,copy);
            if(selected!=font)bump(3);
        }
    }
    if(selected==font)bump(4);
    g->original(text,length,encoding,x,y,selected,path);
}
__declspec(noinline) std::string *__fastcall titleHook(std::string *output,const native_windows_title::View *format,const native_windows_title::Arguments *arguments){
    const bool caller=_ReturnAddress()==reinterpret_cast<void*>(g->extension+0x1effb5);
    const auto inputs=caller?native_windows_title::capture(output,format,arguments):native_windows_title::Inputs{};
    auto *result=g->titleOriginal(output,format,arguments);
    if(caller && result==output){bump(6);if(native_windows_title::project(*output,g->locale.value(),inputs))bump(7);}
    return result;
}
__declspec(noinline) QString saveDialogHook(QWidget *parent,const QString &caption,const QString &directory,const QString &filter,QString *selectedFilter,QFileDialog::Options options){
    // 同一官方scene-save函数的两个caption；预设和Snippet导出caller保持原样。
    return native_save_scene_caption::forwardSaveCaption(g->saveOriginal,true,reinterpret_cast<std::uintptr_t>(_ReturnAddress()),g->extension+0xc6393c,parent,caption,directory,filter,selectedFilter,options,[]{return g->locale.value();});
}
__declspec(noinline) void helpHook(void *owner,const std::string &key,const native_windows_help::Documentation &documentation){
    bump(14);
    using namespace native_help_description;
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(!native_easing_menu::hasDisplayLocale(g->locale.value()))bump(24);
    if(native_windows_help::forward(g->helpOriginal,owner,key,documentation,caller,g->extension,g->locale.value(),{kApprovedRuntimeRootHelp,kApprovedRuntimeRootHelpCount},{kApprovedRuntimeDefHelp,kApprovedRuntimeDefHelpCount}))bump(15);
}
__declspec(noinline) bool layoutHook(QLayout *layout){
    if(_ReturnAddress()==reinterpret_cast<void*>(g->ui+0xd78b7)){
        bump(16);
        if(auto *body=native_help_popup_layout::descriptionLabel(layout)){
            // 与Mac同一四行策略；每进程仅首次批准popup测401根，保留一个整数。
            static const int width=native_help_popup_layout::measureCatalogEnvelope(layout,native_help_popup_metadata::kRows,native_help_popup_metadata::kRowCount);
            if(width>0 && native_help_popup_layout::applyUniformEnvelope(layout,body,width))bump(17);
        }
    }
    return g->layoutOriginal(layout);
}
__declspec(noinline) void guideHook(QTextEdit *editor,const QString &body){
    if(_ReturnAddress()==reinterpret_cast<void*>(g->extension+0x87d35c) && body==QStringLiteral("Keep going...")){
        bump(18);
        const auto text=native_guide_body::approvedBody(g->extension+0x87d35c,g->extension+0x87d35c,native_guide_body::kSourceText,g->locale.value());
        if(!text.empty()){bump(19);const auto projected=QString::fromUtf8(text.data(),qsizetype(text.size()));g->guideOriginal(editor,projected);return;}
    }
    g->guideOriginal(editor,body);
}
__declspec(noinline) QRegularExpression *fastHook(QRegularExpression *self,const QString &pattern,QRegularExpression::PatternOptions options){
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(caller==g->extension+0xcec5cb)bump(20);
    const bool eligible=native_fast_search::policy::eligible(true,caller,g->extension+0xcec5cb,options.toInt(),[&]{return pattern==QLatin1StringView(native_fast_search::abi::kPattern);});
    if(eligible)bump(21);
    // MSVC C1返回this；包括未知caller在内都保留原返回值，排序caller不改。
    return g->fastOriginal(self,pattern,eligible?QRegularExpression::PatternOptions(QRegularExpression::UseUnicodePropertiesOption):options);
}
__declspec(noinline) void easingHook(QWidget *menu,QAction *action){
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(caller==g->extension+0xbf15fc)bump(22);
    QByteArray source;
    native_easing_menu::forwardProjectedAction([&]{g->easingOriginal(menu,action);},true,caller,g->extension+0xbf15fc,
        []{return g->locale.value();},[&]()->std::string_view{if(!action)return {};source=action->text().toUtf8();return {source.constData(),std::size_t(source.size())};},
        [&](std::string_view projected){action->setText(QString::fromUtf8(projected.data(),qsizetype(projected.size())));bump(23);},native_easing_display::kRows);
}
__declspec(noinline) float __fastcall measureHook(const void *font,const void *text,std::size_t length,int encoding,void *bounds,const void *paint){
    const void *selected=font;std::array<std::byte,24> copy{};
    // Windows此调用直接消费同一name成员的完整c_str/strlen；不像分段Viewport需另读父名称。
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(caller==g->extension+0xa7a574 || caller==g->extension+0xa7bf8f){bump(8);selected=displayFont(text,length,encoding,font,copy);if(selected!=font)bump(9);}
    return g->measureOriginal(selected,text,length,encoding,bounds,paint);
}
__declspec(noinline) void __fastcall drawHook(void *canvas,const void *text,std::size_t length,int encoding,float x,float y,const void *font,const void *paint){
    const void *selected=font;std::array<std::byte,24> copy{};
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(caller==g->extension+0xa7a750 || caller==g->extension+0xa7c45d){bump(10);selected=displayFont(text,length,encoding,font,copy);if(selected!=font)bump(11);}
    g->drawOriginal(canvas,text,length,encoding,x,y,selected,paint);
}
__declspec(noinline) void *__fastcall blobHook(void **output,const void *text,std::size_t length,const void *font,int encoding){
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    const void *selected=font;std::array<std::byte,24> copy{};
    if(caller==g->extension+0x4070bc){bump(12);selected=displayFont(text,length,encoding,font,copy);}
    else if(caller==g->extension+0x42a4bf && encoding==0 && lane()){
        native_windows_viewport::Snapshot name;
        if(native_windows_viewport::snapshot(font,g->extension,&name)){bump(12);selected=displayFont(name.bytes.data(),name.size,encoding,font,copy);}
    }
    if(selected!=font)bump(13);
    return g->blobOriginal(output,text,length,selected,encoding);
}
__declspec(noinline) void welcomeHook(void *logger,const void *message,bool enabled,bool traceback){
    bool owned=false;
    // === 通用logger模板先核直接返回点，再查唯一启动producer，未知消息不读取 ===
    if(reinterpret_cast<std::uintptr_t>(_ReturnAddress())==g->extension+0x1e2265){
        void *frames[8]{};const auto count=CaptureStackBackTrace(0,8,frames,nullptr);
        for(unsigned i=0;i<count;++i)if(reinterpret_cast<std::uintptr_t>(frames[i])==g->extension+0xbe9de3){owned=true;break;}
    }
    if(owned)bump(27);
    if(native_windows_welcome::forward(g->welcomeOriginal,logger,message,enabled,traceback,owned,g->locale.value()))bump(28);
}
__declspec(noinline) void catalogWarningHook(void *logger,const void *message,bool enabled,bool traceback){
    bool owned=false;
    // === Api模板也服务真实错误；必须同时命中目标缺文件分支，英语源缺失的相邻分支不准入 ===
    if(reinterpret_cast<std::uintptr_t>(_ReturnAddress())==g->api+0x3b5a6){
        void *frames[6]{};const auto count=CaptureStackBackTrace(0,6,frames,nullptr);
        for(unsigned i=0;i<count;++i)if(reinterpret_cast<std::uintptr_t>(frames[i])==g->api+0x378d8){owned=true;break;}
    }
    if(owned)bump(29);
    if(!g->catalogPack){g->catalogWarningOriginal(logger,message,enabled,traceback);return;}
    using namespace native_windows_catalog_warning;
    const auto root=std::string_view(g->installRootUtf8.constData(),std::size_t(g->installRootUtf8.size()));
    if(forward(g->catalogWarningOriginal,logger,message,enabled,traceback,owned,root,*g->catalogPack,
               kOfficialCatalogs,std::size(kOfficialCatalogs),[]{return approvedPackFile(g->catalogStrings,*g->catalogPack);}))bump(30);
}
__declspec(noinline) native_windows_demo::Result demoHook(const std::string &path){
    const auto caller=reinterpret_cast<std::uintptr_t>(_ReturnAddress());
    if(caller==g->extension+native_windows_demo::kDemoReturn)bump(25);
    return native_windows_demo::forward(g->demoOriginal,path,caller,g->extension,[&]{return g->locale.value();},
        [&](std::string_view source,auto &&locale,std::string *output){
            if(path.empty() || path.find('\0')!=std::string::npos)return false;
            const auto canonical=QFileInfo(QString::fromUtf8(path.data(),static_cast<qsizetype>(path.size()))).canonicalFilePath();
            const auto prefix=g->presetRoot+QLatin1Char('/');
            if(g->presetRoot.isEmpty() || !canonical.startsWith(prefix,Qt::CaseInsensitive))return false;
            const auto relative=canonical.mid(prefix.size());
            for(const auto &file:native_demo_reader::kDemoReaderFiles){
                if(relative.compare(QString::fromUtf8(file.relativePath.data(),static_cast<qsizetype>(file.relativePath.size())),Qt::CaseInsensitive)!=0)continue;
                const bool projected=native_demo_reader::projectVerifiedScript(source,file,native_demo_reader::kDemoReaderTexts,native_demo_reader::kDemoReaderSlots,locale,output);
                if(projected)bump(26);
                return projected;
            }
            return false;
        });
}
QByteArray hashFile(const QString &path){
    QFile f(path);if(!f.open(QIODevice::ReadOnly))return {};
    QCryptographicHash hash(QCryptographicHash::Sha256);if(!hash.addData(&f))return {};return hash.result().toHex();
}
HMODULE verified(const wchar_t *name,const char *sha,const QString &root){
    auto module=GetModuleHandleW(name);if(!module)return nullptr;
    wchar_t path[32768];if(!GetModuleFileNameW(module,path,32768))return nullptr;
    const auto file=QFileInfo(QString::fromWCharArray(path));
    if(file.canonicalPath()!=root || hashFile(file.canonicalFilePath())!=sha)return nullptr;
    return module;
}
void *address(HMODULE module,std::uintptr_t rva){return reinterpret_cast<void*>(reinterpret_cast<std::uintptr_t>(module)+rva);}
bool pin(const void *inside){
    HMODULE pinned=nullptr;return GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_PIN,reinterpret_cast<LPCWSTR>(inside),&pinned)!=FALSE;
}
bool fail(QString *error,const char *message){if(error)*error=QString::fromLatin1(message);return false;}
}

bool installNativeWindowsRuntime(const QString &language,QString *error){
    if(g)return fail(error,"Native runtime installation already attempted");
    if(QString::fromLatin1(qVersion())!=QStringLiteral("6.9.2"))return fail(error,"Native runtime requires Qt6.9.2");
    if(language!=QStringLiteral("zh-Hans") && language!=QStringLiteral("zh-Hant") && language!=QStringLiteral("ja_JP"))return fail(error,"Unsupported native runtime language");
    wchar_t executable[32768];if(!GetModuleFileNameW(nullptr,executable,32768))return fail(error,"Host path unavailable");
    const auto file=QFileInfo(QString::fromWCharArray(executable));const auto root=file.canonicalPath();
    if(hashFile(file.canonicalFilePath())!="bad89abf30c67b2d2fb3c9d0a26c3cfda9b738164e11bca050ac54ad0e2783a1")return fail(error,"Native host identity differs");
    auto core=verified(L"Core.dll","79f13303824d33a70a2f148fe5c9cee7115d724f5e49ff975f9aad54dca8d398",root);
    auto skia=verified(L"skia.dll","e4bac62b373335efeabf5cc79ecdda54c614e0b006437a6d7b79f3a7bc232d77",root);
    auto extension=verified(L"ExtensionLayer.dll","de6825acb8c4dcf8693174f6cc5c21db37f9a43885ee189f0049f8e9163a0337",root);
    auto api=verified(L"Api.dll","c59528bd08e2325eba8f18e1846ca0f551297d36619b1cf70f38448561892567",root);
    auto fmt=verified(L"fmt.dll","2f9c10d067d2c64b7d9e5e9e6e858835be2164c500bce56412c42cd48068455e",root);
    auto widgets=verified(L"Qt6Widgets.dll","31b5eec8575190482fc3cf68854cfa9fda3b756e0fe66546b7fd8bad00658318",root);
    auto ui=verified(L"CavalryUI.dll","08e3a50e1bcfb4ba1c3e989bdbc0d0852e00d3283c4bb560d853b31a5bcb4c72",root);
    auto qtCore=verified(L"Qt6Core.dll","b378b4447d8cd0170755298dd501adf6f648228dc93a07ff1dc8edb8852d7b4c",root);
    auto qtGui=verified(L"Qt6Gui.dll","6ff6fd20bc716f3bb24295afe7006f827c40f20015e473109a26e32062dd987a",root);
    auto spdlog=verified(L"spdlog.dll","f0706dbca48ba564530a6381c56dc9fb89ffe7ef3691a50b18b43995661686b1",root);
    if(!core || !skia || !extension || !api || !fmt || !widgets || !ui || !qtCore || !qtGui || !spdlog)return fail(error,"Native dependency identity differs");
    const auto getPath=GetProcAddress(skia,"?GetPath@SkTextUtils@@SAXPEBX_KW4SkTextEncoding@@MMAEBVSkFont@@PEAVSkPath@@@Z");
    const auto getManager=GetProcAddress(core,"?defaultFontMgr@cavalry@@YA?AV?$sk_sp@VSkFontMgr@@@@XZ");
    const auto match=GetProcAddress(skia,"?matchFamilyStyle@SkFontMgr@@QEBA?AV?$sk_sp@VSkTypeface@@@@QEBDAEBVSkFontStyle@@@Z");
    const auto glyph=GetProcAddress(skia,"?unicharToGlyph@SkTypeface@@QEBAGH@Z");
    const auto locale=GetProcAddress(api,"?activeLocale@cavalry@@YA?AV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@PEAVApi@@@Z");
    if(reinterpret_cast<void*>(getPath)!=address(skia,0x1a660) || reinterpret_cast<void*>(getManager)!=address(core,0x1ded5) || reinterpret_cast<void*>(match)!=address(skia,0x137ad0) || reinterpret_cast<void*>(glyph)!=address(skia,0x20d360) || reinterpret_cast<void*>(locale)!=address(api,0x2f09))return fail(error,"Native export ABI differs");
    auto pathSlot=reinterpret_cast<void**>(address(core,0x1bdd590));auto localeSlot=reinterpret_cast<void**>(address(extension,0x1f965e8));
    auto titleSlot=reinterpret_cast<void**>(address(extension,0x1fa1cd8));
    auto title=GetProcAddress(fmt,"?vformat@v10@fmt@@YA?AV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@V?$basic_string_view@D@12@V?$basic_format_args@V?$basic_format_context@Vappender@v10@fmt@@D@v10@fmt@@@12@@Z");
    if(*pathSlot!=reinterpret_cast<void*>(getPath) || *localeSlot!=reinterpret_cast<void*>(locale) || reinterpret_cast<void*>(title)!=address(fmt,0x15650) || *titleSlot!=reinterpret_cast<void*>(title))return fail(error,"Native import binding differs");
    auto measure=GetProcAddress(skia,"?measureText@SkFont@@QEBAMPEBX_KW4SkTextEncoding@@PEAUSkRect@@PEBVSkPaint@@@Z");
    auto draw=GetProcAddress(skia,"?drawSimpleText@SkCanvas@@QEAAXPEBX_KW4SkTextEncoding@@MMAEBVSkFont@@AEBVSkPaint@@@Z");
    auto blob=GetProcAddress(skia,"?MakeFromText@SkTextBlob@@SA?AV?$sk_sp@VSkTextBlob@@@@PEBX_KAEBVSkFont@@W4SkTextEncoding@@@Z");
    auto measureSlot=reinterpret_cast<void**>(address(extension,0x1fa29e0));auto drawSlot=reinterpret_cast<void**>(address(extension,0x1fa29c8));auto blobSlot=reinterpret_cast<void**>(address(extension,0x1fa29b8));
    if(reinterpret_cast<void*>(measure)!=address(skia,0x13ec90) || reinterpret_cast<void*>(draw)!=address(skia,0x11c070) || reinterpret_cast<void*>(blob)!=address(skia,0x20ae90) || *measureSlot!=reinterpret_cast<void*>(measure) || *drawSlot!=reinterpret_cast<void*>(draw) || *blobSlot!=reinterpret_cast<void*>(blob))return fail(error,"Native name font import ABI differs");
    // 全部函数先经官方同根映像/导出核验。固定3 face沿当前语言优先，进程期持有。
    auto save=GetProcAddress(widgets,"?getSaveFileName@QFileDialog@@SA?AVQString@@PEAVQWidget@@AEBV2@11PEAV2@V?$QFlags@W4Option@QFileDialog@@@@@Z");
    auto saveSlot=reinterpret_cast<void**>(address(extension,0x1f9e800));
    if(reinterpret_cast<void*>(save)!=address(widgets,0x253bb0) || *saveSlot!=reinterpret_cast<void*>(save))return fail(error,"Native save dialog import ABI differs");
    auto help=GetProcAddress(ui,"?addScriptDocumentationEntry@TextEdit@@QEAAXAEBV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@AEBUScriptDocumentation@cavalry@@@Z");
    auto helpSlot=reinterpret_cast<void**>(address(extension,0x1f97b88));
    if(reinterpret_cast<void*>(help)!=address(ui,0x355d) || *helpSlot!=reinterpret_cast<void*>(help))return fail(error,"Native help documentation import ABI differs");
    auto activate=GetProcAddress(widgets,"?activate@QLayout@@QEAA_NXZ");
    auto layoutSlot=reinterpret_cast<void**>(address(ui,0x29bf10));
    if(reinterpret_cast<void*>(activate)!=address(widgets,0x3d8a0) || *layoutSlot!=reinterpret_cast<void*>(activate))return fail(error,"Native help layout import ABI differs");
    auto guide=GetProcAddress(widgets,"?setText@QTextEdit@@QEAAXAEBVQString@@@Z");
    auto guideSlot=reinterpret_cast<void**>(address(extension,0x1f9f208));
    if(reinterpret_cast<void*>(guide)!=address(widgets,0x20ca70) || *guideSlot!=reinterpret_cast<void*>(guide))return fail(error,"Native guide body import ABI differs");
    auto fast=GetProcAddress(qtCore,"??0QRegularExpression@@QEAA@AEBVQString@@V?$QFlags@W4PatternOption@QRegularExpression@@@@@Z");
    auto fastSlot=reinterpret_cast<void**>(address(extension,0x1f9cc10));
    auto easing=GetProcAddress(widgets,"?addAction@QWidget@@QEAAXPEAVQAction@@@Z");
    auto easingSlot=reinterpret_cast<void**>(address(extension,0x1fa0300));
    if(reinterpret_cast<void*>(fast)!=address(qtCore,0x268a10) || *fastSlot!=reinterpret_cast<void*>(fast) || reinterpret_cast<void*>(easing)!=address(widgets,0x50660) || *easingSlot!=reinterpret_cast<void*>(easing))return fail(error,"Native Fast/easing import ABI differs");
    auto demo=GetProcAddress(core,"?textFromFile@cavalry@@YA?AV?$optional@V?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@@std@@AEBV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@3@@Z");
    auto demoSlot=reinterpret_cast<void**>(address(extension,0x1f98a08));
    const auto presetRoot=QFileInfo(root+QStringLiteral("/assets/Presets")).canonicalFilePath();
    if(reinterpret_cast<void*>(demo)!=address(core,0x10cb7) || *demoSlot!=reinterpret_cast<void*>(demo) || presetRoot.isEmpty())return fail(error,"Native Demo reader import or selected Presets root differs");
    auto welcome=GetProcAddress(spdlog,"?log_it_@logger@spdlog@@IEAAXAEBUlog_msg@details@2@_N1@Z");
    auto welcomeSlot=reinterpret_cast<void**>(address(extension,0x1fa30d0));
    if(reinterpret_cast<void*>(welcome)!=address(spdlog,0x12550) || *welcomeSlot!=reinterpret_cast<void*>(welcome))return fail(error,"Native Welcome logger import ABI differs");
    auto catalogWarningSlot=reinterpret_cast<void**>(address(api,0x377df8));
    if(*catalogWarningSlot!=reinterpret_cast<void*>(welcome))return fail(error,"Native catalog logger import ABI differs");
    if(!pin(core) || !pin(skia) || !pin(extension) || !pin(api) || !pin(fmt) || !pin(widgets) || !pin(ui) || !pin(qtCore) || !pin(qtGui) || !pin(spdlog) || !pin(reinterpret_cast<const void*>(pathHook)))return fail(error,"Native callback module PIN failed");
    auto *state=new State;state->original=reinterpret_cast<NativeGetPathFunction>(getPath);state->glyph=reinterpret_cast<Glyph>(glyph);state->localeOriginal=reinterpret_cast<ActiveLocale>(locale);state->core=reinterpret_cast<std::uintptr_t>(core);state->extension=reinterpret_cast<std::uintptr_t>(extension);
    state->api=reinterpret_cast<std::uintptr_t>(api);state->installRootUtf8=root.toUtf8();
    for(const auto &proof:native_windows_catalog_warning::kApprovedPacks)
        if(proof.language==language.toStdString())state->catalogPack=&proof;
    PWSTR roaming=nullptr;
    if(SUCCEEDED(SHGetKnownFolderPath(FOLDERID_RoamingAppData,KF_FLAG_DONT_VERIFY,nullptr,&roaming))){
        state->catalogStrings=QString::fromWCharArray(roaming)+QStringLiteral("/Cavalry/Third-Party/Plugins/Cavalry-i18n/strings.json");
        CoTaskMemFree(roaming);
    }
    void *manager=nullptr;reinterpret_cast<DefaultManager>(getManager)(&manager);if(!manager)return fail(error,"Vendor font manager unavailable");
    std::array<const char*,3> families{"Microsoft YaHei UI","Microsoft JhengHei UI","Yu Gothic UI"};
    if(language==QStringLiteral("zh-Hant"))std::swap(families[0],families[1]);
    else if(language==QStringLiteral("ja_JP"))std::swap(families[0],families[2]);
    const std::uint32_t style=0x50190;
    for(const auto family:families){void *face=nullptr;reinterpret_cast<MatchFamily>(match)(manager,&face,family,&style);if(face)state->faces[state->faceCount++]=face;}
    if(!state->faceCount)return fail(error,"No native system typeface");
    g=state;
    state->catalogWarningOriginal=reinterpret_cast<native_windows_catalog_warning::Original>(welcome);
    if(!replaceCavalryIatPointer(catalogWarningSlot,reinterpret_cast<void*>(welcome),reinterpret_cast<void*>(catalogWarningHook),error))return false;
    state->welcomeOriginal=reinterpret_cast<native_windows_welcome::Original>(welcome);
    if(!replaceCavalryIatPointer(welcomeSlot,reinterpret_cast<void*>(welcome),reinterpret_cast<void*>(welcomeHook),error))return false;
    state->demoOriginal=reinterpret_cast<native_windows_demo::Original>(demo);state->presetRoot=presetRoot;
    if(!replaceCavalryIatPointer(demoSlot,reinterpret_cast<void*>(demo),reinterpret_cast<void*>(demoHook),error))return false;
    state->fastOriginal=reinterpret_cast<FastConstructor>(fast);state->easingOriginal=reinterpret_cast<decltype(state->easingOriginal)>(easing);
    if(!replaceCavalryIatPointer(fastSlot,reinterpret_cast<void*>(fast),reinterpret_cast<void*>(fastHook),error) || !replaceCavalryIatPointer(easingSlot,reinterpret_cast<void*>(easing),reinterpret_cast<void*>(easingHook),error))return false;
    state->guideOriginal=reinterpret_cast<decltype(state->guideOriginal)>(guide);
    if(!replaceCavalryIatPointer(guideSlot,reinterpret_cast<void*>(guide),reinterpret_cast<void*>(guideHook),error))return false;
    state->ui=reinterpret_cast<std::uintptr_t>(ui);state->layoutOriginal=reinterpret_cast<decltype(state->layoutOriginal)>(activate);
    if(!replaceCavalryIatPointer(layoutSlot,reinterpret_cast<void*>(activate),reinterpret_cast<void*>(layoutHook),error))return false;
    state->helpOriginal=reinterpret_cast<native_windows_help::Original>(help);
    if(!replaceCavalryIatPointer(helpSlot,reinterpret_cast<void*>(help),reinterpret_cast<void*>(helpHook),error))return false;
    state->saveOriginal=reinterpret_cast<SaveDialogFunction>(save);
    if(!replaceCavalryIatPointer(saveSlot,reinterpret_cast<void*>(save),reinterpret_cast<void*>(saveDialogHook),error))return false;
    state->measureOriginal=reinterpret_cast<NativeMeasureFunction>(measure);state->drawOriginal=reinterpret_cast<NativeDrawFunction>(draw);state->blobOriginal=reinterpret_cast<NativeBlobFunction>(blob);
    if(!replaceCavalryIatPointer(measureSlot,reinterpret_cast<void*>(measure),reinterpret_cast<void*>(measureHook),error) || !replaceCavalryIatPointer(drawSlot,reinterpret_cast<void*>(draw),reinterpret_cast<void*>(drawHook),error) || !replaceCavalryIatPointer(blobSlot,reinterpret_cast<void*>(blob),reinterpret_cast<void*>(blobHook),error))return false;
    state->titleOriginal=reinterpret_cast<TitleFormat>(title);
    if(!replaceCavalryIatPointer(titleSlot,reinterpret_cast<void*>(title),reinterpret_cast<void*>(titleHook),error))return false;
    if(!replaceCavalryIatPointer(localeSlot,reinterpret_cast<void*>(locale),reinterpret_cast<void*>(localeHook),error))return false;
    return replaceCavalryIatPointer(pathSlot,reinterpret_cast<void*>(getPath),reinterpret_cast<void*>(pathHook),error);
}

QJsonObject nativeWindowsRuntimeDiagnostics(){
    if(!g)return {{QStringLiteral("installed"),false}};
    QJsonObject result{{QStringLiteral("locale"),QString::fromLatin1(g->locale.hint()?g->locale.hint():"unset")}};
    const char *names[]={"pathCalls","approvedText","ownerMatch","fallback","forward","localeCaptured","titleCalls","titleProjected","timelineMeasure","timelineMeasureFallback","timelineDraw","timelineDrawFallback","viewportName","viewportNameFallback","helpEntries","helpProjected","helpLayouts","helpLayoutProjected","guideBodies","guideProjected","fastQueries","fastUnicode","easingActions","easingProjected","helpBeforeLocale","demoReads","demoProjected","welcomeOwned","welcomeProjected","catalogWarningOwned","catalogWarningQuiet"};
    for(unsigned i=0;i<std::size(names);++i)result[QString::fromLatin1(names[i])]=double(g->stats[i].load(std::memory_order_relaxed));
    return result;
}
