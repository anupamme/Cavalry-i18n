/**
 * [INPUT]: 依赖baseline storage adapter与隔离临时文件系统。
 * [OUTPUT]: 验证JSON字节限额、nofollow读取、流式blob与排他目录发布。
 * [POS]: storage子模块的Unix合同；不访问Cavalry、profile或codesign。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{
    fs,
    io::{self, Read},
    os::unix::fs::PermissionsExt,
    path::Path,
};

use super::*;

#[test]
fn bounded_json_accepts_exact_limit_and_rejects_one_byte_over() {
    let bytes = json_bytes_bounded(&"abc", 5).unwrap();
    assert_eq!(bytes, br#""abc""#);
    assert!(json_bytes_bounded(&"abc", 4).is_err());
}

#[test]
fn bounded_manifest_reader_rejects_size_over_limit_and_symlink() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("manifest.json");
    fs::write(&path, b"12345").unwrap();
    assert!(read_bounded_regular(&path, 4).is_err());

    let link = temp.path().join("manifest-link.json");
    std::os::unix::fs::symlink(&path, &link).unwrap();
    assert!(read_bounded_regular(&link, 8).is_err());
}

#[test]
fn bounded_manifest_reader_accepts_exact_limit() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("manifest.json");
    fs::write(&path, b"12345").unwrap();
    let (bytes, mode) = read_bounded_regular(&path, 5).unwrap();
    assert_eq!(bytes, b"12345");
    assert_eq!(mode, 0o644);
}

#[test]
fn streaming_copy_proves_content_and_keeps_blob_private() {
    let temp = tempfile::tempdir().unwrap();
    let source = temp.path().join("source.bin");
    let destination = temp.path().join("blob.bin");
    fs::write(&source, vec![0x5a; HASH_BUFFER_BYTES * 3 + 7]).unwrap();
    fs::set_permissions(&source, fs::Permissions::from_mode(0o755)).unwrap();

    let expected = digest_regular(&source, fs::metadata(&source).unwrap().len()).unwrap();
    let copied = copy_regular_nofollow(&source, &destination, &expected).unwrap();
    assert_eq!(copied, expected);
    assert_eq!(
        fs::metadata(destination).unwrap().permissions().mode() & 0o7777,
        0o600
    );
}

#[test]
fn streaming_copy_rejects_wrong_expected_digest() {
    let temp = tempfile::tempdir().unwrap();
    let source = temp.path().join("source.bin");
    let destination = temp.path().join("blob.bin");
    fs::write(&source, b"original").unwrap();
    let mut expected = digest_regular(&source, fs::metadata(&source).unwrap().len()).unwrap();
    expected.sha256 = "00".repeat(32);
    assert!(copy_regular_nofollow(&source, &destination, &expected).is_err());
}

#[test]
fn bounded_reader_consumes_at_most_expected_bytes_plus_one_sentinel() {
    struct CountingReader {
        bytes: Vec<u8>,
        consumed: usize,
    }
    impl Read for CountingReader {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            let count = buffer.len().min(self.bytes.len() - self.consumed);
            buffer[..count].copy_from_slice(&self.bytes[self.consumed..self.consumed + count]);
            self.consumed += count;
            Ok(count)
        }
    }

    let mut input = CountingReader {
        bytes: vec![7; HASH_BUFFER_BYTES * 4],
        consumed: 0,
    };
    let mut output = io::sink();
    assert!(copy_stream_bounded(&mut input, &mut output, 3).is_err());
    assert_eq!(
        input.consumed, 4,
        "the extra-byte probe must be the only read beyond the bound"
    );
}

#[test]
fn bounded_reader_rejects_short_input_without_reading_again() {
    struct CountingReader {
        bytes: Vec<u8>,
        consumed: usize,
    }
    impl Read for CountingReader {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            let count = buffer.len().min(self.bytes.len() - self.consumed);
            buffer[..count].copy_from_slice(&self.bytes[self.consumed..self.consumed + count]);
            self.consumed += count;
            Ok(count)
        }
    }

    let mut input = CountingReader {
        bytes: b"short".to_vec(),
        consumed: 0,
    };
    let mut output = io::sink();
    assert!(copy_stream_bounded(&mut input, &mut output, 10).is_err());
    assert_eq!(input.consumed, 5);
}

#[test]
fn exclusive_publish_preserves_an_existing_empty_generation() {
    let temp = tempfile::tempdir().unwrap();
    let stage = temp.path().join("stage");
    let generation = temp.path().join("generation");
    fs::create_dir(&stage).unwrap();
    fs::create_dir(&generation).unwrap();

    assert!(publish_exclusive(&stage, &generation).is_err());
    assert!(stage.is_dir());
    assert_eq!(fs::read_dir(&generation).unwrap().count(), 0);
}

#[test]
fn exact_members_rejects_extra_file_and_symlink() {
    let temp = tempfile::tempdir().unwrap();
    let dir = temp.path().join("blobs");
    fs::create_dir(&dir).unwrap();
    fs::write(dir.join("slot-0.bin"), b"x").unwrap();
    exact_directory_members(&dir, &["slot-0.bin".into()]).unwrap();

    fs::write(dir.join("extra.bin"), b"x").unwrap();
    assert!(exact_directory_members(&dir, &["slot-0.bin".into()]).is_err());
    fs::remove_file(dir.join("extra.bin")).unwrap();
    std::os::unix::fs::symlink(Path::new("slot-0.bin"), dir.join("alias.bin")).unwrap();
    assert!(exact_directory_members(&dir, &["alias.bin".into(), "slot-0.bin".into()]).is_err());
}
