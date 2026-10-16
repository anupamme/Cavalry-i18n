/**
 * [INPUT]: 依赖当前架构ABI门解析的Core与Skia字体工厂地址。
 * [OUTPUT]: 提供共享字体策略使用的原厂函数指针槽。
 * [POS]: ARM与x86 verifier分别绑定本架构地址；空指针时共享策略透传。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if defined(__x86_64__)
MakeTypeface gMakeTypeface = nullptr;
GetCTFont gGetCTFont = nullptr;
MakeFont gMakeFont = nullptr;
#endif
