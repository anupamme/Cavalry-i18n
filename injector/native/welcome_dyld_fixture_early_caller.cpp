/**
 * [INPUT]: 依赖fake spdlog调用桩与共享fixture状态。
 * [OUTPUT]: 在interposer构造器之前发出一次带errno哨兵的日志调用。
 * [POS]: interposer的依赖镜像；dyld先运行本constructor。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "welcome_dyld_fixture_contract.h"

#include <cerrno>

extern "C" __attribute__((constructor)) void welcomeFixtureEarlyConstructor()
{
    welcomeFixtureRecordExpectedReturn(
        reinterpret_cast<std::uintptr_t>(&welcomeFixtureOriginalReturn));
    errno = 0x5a;
    welcomeFixtureTriggerEarlyLog();
    welcomeFixtureRecordPostCallErrno(errno);
}

extern "C" void welcomeFixtureEarlyCallerAnchor()
{
}
