/**
 * [INPUT]: 依赖build.rs嵌入的native runtime injector、native_resources编译期BuildMode门及目标架构Mach-O校验。
 * [OUTPUT]: 仅在native runtime已启用且内嵌字节通过当前编译目标的薄MH_DYLIB边界时提供approved_runtime_bytes。
 * [POS]: commands的只读runtime源桥；不读取运行时环境、不接受调用方路径，也不接默认2.7 injector。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#[path = "../../native/native_preview_injector_contract.rs"]
mod native_preview_injector_contract;

const COMPILED_INJECTOR: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/native_runtime_injector.dylib"));

pub(crate) fn approved_runtime_bytes() -> Result<&'static [u8], String> {
    validate_approved_runtime_bytes(
        super::native_resources::native_runtime_enabled(),
        COMPILED_INJECTOR,
        std::env::consts::ARCH,
    )
    .map_err(str::to_owned)?;
    Ok(COMPILED_INJECTOR)
}

fn validate_approved_runtime_bytes(
    runtime_enabled: bool,
    bytes: &[u8],
    target_arch: &str,
) -> Result<(), &'static str> {
    if !runtime_enabled {
        return Err("native runtime was not enabled at compile time");
    }
    if bytes.is_empty() {
        return Err("native runtime injector was not approved at build time");
    }
    native_preview_injector_contract::validate_dylib_for_arch(bytes, target_arch)
}

#[cfg(test)]
mod tests {
    use super::validate_approved_runtime_bytes;

    #[test]
    fn approved_bytes_require_runtime_mode_and_a_nonempty_valid_image() {
        assert!(validate_approved_runtime_bytes(false, b"candidate", "x86_64").is_err());
        assert!(validate_approved_runtime_bytes(true, &[], "x86_64").is_err());
        assert!(validate_approved_runtime_bytes(true, b"not a Mach-O", "x86_64").is_err());
        assert!(validate_approved_runtime_bytes(true, &valid_dylib(0x0100_0007), "x86_64").is_ok());
        assert!(
            validate_approved_runtime_bytes(true, &valid_dylib(0x0100_000c), "x86_64").is_err()
        );
        assert!(
            validate_approved_runtime_bytes(true, &valid_dylib(0x0100_000c), "aarch64").is_ok()
        );
    }

    fn valid_dylib(cpu_type: u32) -> Vec<u8> {
        let mut bytes = vec![0_u8; 56];
        bytes[..4].copy_from_slice(&[0xcf, 0xfa, 0xed, 0xfe]);
        bytes[4..8].copy_from_slice(&cpu_type.to_le_bytes());
        bytes[12..16].copy_from_slice(&6_u32.to_le_bytes());
        bytes[16..20].copy_from_slice(&1_u32.to_le_bytes());
        bytes[20..24].copy_from_slice(&24_u32.to_le_bytes());
        bytes[32..36].copy_from_slice(&0x1b_u32.to_le_bytes());
        bytes[36..40].copy_from_slice(&24_u32.to_le_bytes());
        bytes
    }
}
