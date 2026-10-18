/*
 * [INPUT]: QPA已核manifest与显式语言，以及当前官方2.8/Qt6.9.2运行时。
 * [OUTPUT]: 安装窄native补充、提供只读计数；不管理配置或启动进程。
 * [POS]: Windows native generic与内部ABI/显示适配之间的唯一接口。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include <QtCore/QJsonObject>
#include <QtCore/QString>
bool installNativeWindowsRuntime(const QString &language,QString *error);
QJsonObject nativeWindowsRuntimeDiagnostics();
