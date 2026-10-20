/*
 * [INPUT]: 固定用户包路径、同版生成的长度/SHA及Windows文件属性、Qt只读文件与摘要能力。
 * [OUTPUT]: 对一次精确启动warning提供实际pack证明；不存在、重解析、漂移或读取失败均拒绝降噪。
 * [POS]: catalog_warning_adapter的只读叶子；仅在精确producer/消息命中后读取，不扫描目录或读取偏好/认证。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "catalog_warning_policy.h"
#include <windows.h>
#include <QtCore/QCryptographicHash>
#include <QtCore/QDir>
#include <QtCore/QFile>
#include <QtCore/QFileInfo>
namespace native_windows_catalog_warning {
inline bool approvedPackFile(const QString &path,const PackProof &proof){
    if(path.isEmpty() || proof.bytes==0 || proof.bytes>4*1024*1024 || proof.sha256.size()!=64)return false;
    const auto absolute=QDir::toNativeSeparators(QFileInfo(path).absoluteFilePath()).toStdWString();
    // === 只读证明也拒绝借重解析点冒充固定用户包 ===
    for(std::size_t i=3;i<=absolute.size();++i){
        if(i!=absolute.size() && absolute[i]!=L'\\')continue;
        const auto part=absolute.substr(0,i);const auto attributes=GetFileAttributesW(part.c_str());
        if(attributes==INVALID_FILE_ATTRIBUTES || (attributes&FILE_ATTRIBUTE_REPARSE_POINT))return false;
    }
    if(!QFileInfo(path).isFile())return false;
    QFile file(path);
    if(!file.open(QIODevice::ReadOnly) || file.size()!=qint64(proof.bytes))return false;
    const auto bytes=file.read(qint64(proof.bytes)+1);
    if(bytes.size()!=qint64(proof.bytes) || file.error()!=QFileDevice::NoError)return false;
    return QCryptographicHash::hash(bytes,QCryptographicHash::Sha256).toHex()==
        QByteArray(proof.sha256.data(),qsizetype(proof.sha256.size()));
}
}
