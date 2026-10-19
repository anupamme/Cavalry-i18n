/**
 * [INPUT]: 依赖主映像路径、Frameworks叶名与已加载映像路径。
 * [OUTPUT]: 提供规范可执行文件定位与规范真实路径比较。
 * [POS]: 候选ABI准入的无状态路径工具；不缓存、不记录诊断。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <cstddef>
#include <cstdio>
#include <cstring>
#include <limits.h>
#include <stdlib.h>

namespace native_image_paths {

inline bool pathMatchesCanonical(const char *path, const char *expected) noexcept
{
    if (path == nullptr || expected == nullptr) return false;
    char canonical[PATH_MAX]{};
    return ::realpath(path, canonical) != nullptr &&
           std::strcmp(canonical, expected) == 0;
}

inline bool frameworksPathForExecutable(const char *executablePath, const char *leaf,
                                        char *output, std::size_t capacity) noexcept
{
    if (executablePath == nullptr || leaf == nullptr || leaf[0] == '\0' ||
        std::strchr(leaf, '/') != nullptr || output == nullptr || capacity == 0)
        return false;

    char canonical[PATH_MAX]{};
    if (::realpath(executablePath, canonical) == nullptr || canonical[0] != '/')
        return false;

    constexpr char kMacOSDirectory[] = "/Contents/MacOS/";
    const char *directory = std::strstr(canonical, kMacOSDirectory);
    if (directory == nullptr || std::strstr(directory + 1, kMacOSDirectory) != nullptr)
        return false;
    const char *executable = directory + sizeof(kMacOSDirectory) - 1;
    if (executable[0] == '\0' || std::strchr(executable, '/') != nullptr) return false;

    const auto bundlePrefix = static_cast<int>(directory - canonical);
    const int length = std::snprintf(output, capacity, "%.*s/Contents/Frameworks/%s",
        bundlePrefix, canonical, leaf);
    return length > 0 && static_cast<std::size_t>(length) < capacity;
}

}  // namespace native_image_paths
