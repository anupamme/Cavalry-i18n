/**
 * [INPUT]: 依赖候选二进制的原始字节切片，不访问路径、环境变量或平台命令。
 * [OUTPUT]: 提供build.rs与native_runtime_source共用的arm64薄MH_DYLIB边界校验。
 * [POS]: src-tauri/native的纯Mach-O合同；只验证头部、架构、文件类型和load-command边界，不证明ABI或签名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
pub(crate) fn validate_arm64_dylib(bytes: &[u8]) -> Result<(), &'static str> {
    const HEADER_SIZE: usize = 32;
    const CPU_TYPE_ARM64: u32 = 0x0100_000c;
    const MH_DYLIB: u32 = 6;

    if bytes.len() < HEADER_SIZE {
        return Err("Mach-O header is truncated");
    }
    if bytes[..4] != [0xcf, 0xfa, 0xed, 0xfe] {
        return Err("input is not a thin little-endian 64-bit Mach-O");
    }
    if read_u32_le(bytes, 4) != Some(CPU_TYPE_ARM64) {
        return Err("Mach-O CPU type is not arm64");
    }
    if read_u32_le(bytes, 12) != Some(MH_DYLIB) {
        return Err("Mach-O file type is not a dylib");
    }

    let command_count = read_u32_le(bytes, 16).ok_or("Mach-O header is truncated")? as usize;
    let command_bytes = read_u32_le(bytes, 20).ok_or("Mach-O header is truncated")? as usize;
    if command_count == 0 || command_bytes < command_count.saturating_mul(8) {
        return Err("Mach-O load-command table is empty or undersized");
    }
    let command_end = HEADER_SIZE
        .checked_add(command_bytes)
        .ok_or("Mach-O load-command table overflows")?;
    if command_end > bytes.len() {
        return Err("Mach-O load-command table is truncated");
    }

    let mut offset = HEADER_SIZE;
    for _ in 0..command_count {
        let command_size = read_u32_le(bytes, offset + 4)
            .ok_or("Mach-O load command header is truncated")? as usize;
        if command_size < 8 || command_size % 4 != 0 {
            return Err("Mach-O load command size is invalid");
        }
        let next = offset
            .checked_add(command_size)
            .ok_or("Mach-O load command overflows")?;
        if next > command_end {
            return Err("Mach-O load command exceeds its table");
        }
        offset = next;
    }
    if offset != command_end {
        return Err("Mach-O load-command table size does not match its entries");
    }
    Ok(())
}

fn read_u32_le(bytes: &[u8], offset: usize) -> Option<u32> {
    let value = bytes.get(offset..offset.checked_add(4)?)?;
    Some(u32::from_le_bytes([value[0], value[1], value[2], value[3]]))
}

#[cfg(test)]
mod tests {
    use super::validate_arm64_dylib;

    #[test]
    fn accepts_only_bounded_thin_arm64_dylib_headers() {
        assert!(validate_arm64_dylib(&valid_arm64_dylib()).is_ok());

        let mut x86_64 = valid_arm64_dylib();
        write_u32_le(&mut x86_64, 4, 0x0100_0007);
        assert!(validate_arm64_dylib(&x86_64).is_err());

        let mut executable = valid_arm64_dylib();
        write_u32_le(&mut executable, 12, 2);
        assert!(validate_arm64_dylib(&executable).is_err());

        let mut truncated_table = valid_arm64_dylib();
        write_u32_le(&mut truncated_table, 20, 0xffff_ffff);
        assert!(validate_arm64_dylib(&truncated_table).is_err());

        let mut malformed_command = valid_arm64_dylib();
        write_u32_le(&mut malformed_command, 32 + 4, 0);
        assert!(validate_arm64_dylib(&malformed_command).is_err());

        assert!(validate_arm64_dylib(&[]).is_err());
    }

    fn valid_arm64_dylib() -> Vec<u8> {
        const HEADER_SIZE: usize = 32;
        const LC_UUID_SIZE: usize = 24;

        let mut bytes = vec![0_u8; HEADER_SIZE + LC_UUID_SIZE];
        bytes[..4].copy_from_slice(&[0xcf, 0xfa, 0xed, 0xfe]);
        write_u32_le(&mut bytes, 4, 0x0100_000c);
        write_u32_le(&mut bytes, 12, 6);
        write_u32_le(&mut bytes, 16, 1);
        write_u32_le(&mut bytes, 20, LC_UUID_SIZE as u32);
        write_u32_le(&mut bytes, HEADER_SIZE, 0x1b);
        write_u32_le(&mut bytes, HEADER_SIZE + 4, LC_UUID_SIZE as u32);
        bytes
    }

    fn write_u32_le(bytes: &mut [u8], offset: usize, value: u32) {
        bytes[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
    }
}
