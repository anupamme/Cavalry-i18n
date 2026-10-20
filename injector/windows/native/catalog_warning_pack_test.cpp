/*
 * [INPUT]: Windows实际临时文件、Qt摘要及生产approvedPackFile只读证明。
 * [OUTPUT]: 真实文件正例与缺失、漂移、错长度、目录和越界pack拒绝合同。
 * [POS]: 仅临时文件的包证明回归；不访问真实用户profile或运行厂商代码。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "catalog_warning_pack.h"
#include <QtCore/QTemporaryDir>
#include <cstdio>
int main(){
    using namespace native_windows_catalog_warning;
    QTemporaryDir directory;if(!directory.isValid())return 1;
    const auto path=directory.filePath(QStringLiteral("strings.json"));
    const QByteArray bytes="[{\"type\":\"strings\",\"language\":\"zh-Hans\",\"value\":{}}]";
    const auto sha=QCryptographicHash::hash(bytes,QCryptographicHash::Sha256).toHex();
    PackProof proof{"zh-Hans","zh-Hans",{sha.constData(),std::size_t(sha.size())},std::uint64_t(bytes.size())};
    if(approvedPackFile(path,proof))return 2;
    {QFile file(path);if(!file.open(QIODevice::WriteOnly) || file.write(bytes)!=bytes.size())return 3;}
    if(!approvedPackFile(path,proof))return 4;
    auto wrong=proof;++wrong.bytes;if(approvedPackFile(path,wrong))return 5;
    wrong.bytes=4*1024*1024+1;if(approvedPackFile(path,wrong))return 6;
    if(approvedPackFile(directory.path(),proof))return 7;
    {QFile file(path);if(!file.open(QIODevice::ReadWrite))return 8;file.write("x",1);}
    if(approvedPackFile(path,proof))return 9;
    std::puts("Actual approved/missing/drifted/bounded pack file checks passed");
}
