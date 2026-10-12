/**
 * [INPUT]: 依赖build.rs嵌入的native预览injector、native_resources编译期预览门及native_preview_injector_contract的Mach-O校验。
 * [OUTPUT]: 仅在预览已启用且内嵌字节通过arm64薄MH_DYLIB边界时提供approved_runtime_bytes。
 * [POS]: commands的只读预览源桥；不读取运行时环境、不接受调用方路径，也不接默认2.7 injector。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#[path = "../../native/native_preview_injector_contract.rs"]
mod native_preview_injector_contract;

const COMPILED_INJECTOR: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/native_preview_injector.dylib"));

pub(crate) fn approved_runtime_bytes() -> Result<&'static [u8], String> {
    validate_approved_runtime_bytes(
        super::native_resources::preview_enabled(),
        COMPILED_INJECTOR,
    )
    .map_err(str::to_owned)?;
    Ok(COMPILED_INJECTOR)
}

fn validate_approved_runtime_bytes(
    preview_enabled: bool,
    bytes: &[u8],
) -> Result<(), &'static str> {
    if !preview_enabled {
        return Err("native preview was not enabled at compile time");
    }
    if bytes.is_empty() {
        return Err("native preview injector was not approved at build time");
    }
    native_preview_injector_contract::validate_arm64_dylib(bytes)
}

#[cfg(test)]
mod tests {
    use super::validate_approved_runtime_bytes;

    #[test]
    fn approved_bytes_require_preview_and_a_nonempty_valid_image() {
        assert!(validate_approved_runtime_bytes(false, b"candidate").is_err());
        assert!(validate_approved_runtime_bytes(true, &[]).is_err());
        assert!(validate_approved_runtime_bytes(true, b"not a Mach-O").is_err());
    }
}
