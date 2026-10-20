/*
 * [INPUT]: Welcome已证的Windows log_msg ABI、Api精确调用点、纯catalog策略及调用方提供的包证明。
 * [OUTPUT]: 仅在完整消息和实际批准包同时命中时省略预期warning；其它消息与参数原样单次转发。
 * [POS]: Api独有IAT的薄适配；不更改logger级别，不缓存用户文字，未知caller不读消息。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once
#include "catalog_warning_policy.h"
#include "welcome_adapter.h"
namespace native_windows_catalog_warning {
using Message=native_windows_welcome::Message;
using Original=native_windows_welcome::Original;
template<class VerifyPack>
bool forward(Original original,void *logger,const void *message,bool enabled,bool traceback,
             bool exactCaller,std::string_view root,const PackProof &proof,
             const std::string_view *catalogs,std::size_t count,VerifyPack verifyPack){
    bool quiet=false;
    if(exactCaller && enabled && !traceback && message){
        try{
            Message value{};std::memcpy(&value,message,sizeof(value));
            std::int32_t level=-1;std::memcpy(&level,value.prefix+0x10,sizeof(level));
            if(level==3 && value.payload && value.payloadSize>0 && value.payloadSize<=32768 &&
               expectedWarning({value.payload,value.payloadSize},root,proof,catalogs,count))quiet=verifyPack();
        }catch(...){quiet=false;}
    }
    if(!quiet)original(logger,message,enabled,traceback);
    return quiet;
}
}
