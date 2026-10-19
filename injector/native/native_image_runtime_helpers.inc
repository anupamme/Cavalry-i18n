/**
 * [INPUT]: 依赖当前可执行路径、Mach-O路径映射器与符号解析器。
 * [OUTPUT]: 提供Frameworks路径定位和精确导出地址判定。
 * [POS]: native运行门共用的映像寻址原语；不授权任何ABI lane。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#if defined(__x86_64__)
bool appFrameworkPath(const char *leaf, char *output, std::size_t capacity) noexcept
{
    char executable[PATH_MAX]{};
    std::uint32_t size = sizeof(executable);
    if (_NSGetExecutablePath(executable, &size) != 0) return false;
    return native_image_paths::frameworksPathForExecutable(
        executable, leaf, output, capacity);
}

bool symbolAt(const LoadedImage &image, const char *symbol,
              std::uintptr_t offset) noexcept
{
    return findMachOSymbol(image, symbol) == imageAddress(image, offset);
}
#endif
