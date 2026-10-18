/**
 * [INPUT]: 依赖Windows原生路径facade与临时任意安装根。
 * [OUTPUT]: 验证目录/EXE选择等价、中文空格路径、2.8发现不要求旧资产、首次只读state规划零写入。
 * [POS]: Windows接线差异合同；只用临时目录，不接真实profile或宿主进程。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

#[test]
fn arbitrary_root_and_executable_selection_share_native_layout() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().join("任意盘目录 with spaces").join("Host 2.8");
    fs::create_dir_all(&root).unwrap();
    fs::write(
        root.join("Cavalry.exe"),
        b"discovery fixture, not a verified vendor binary",
    )
    .unwrap();
    let directory = native_layout(&root).unwrap();
    let executable = native_layout(&root.join("Cavalry.exe")).unwrap();
    assert_eq!(directory, executable);
    assert!(!directory.assets_root.exists());
    assert!(
        verify_host(&root).is_err(),
        "discovery must not grant write admission"
    );
    assert_eq!(vendor_origin(&root), "unknown");
}

#[test]
fn absent_state_plan_is_canonical_without_creating_directories() {
    let temp = tempfile::tempdir().unwrap();
    let planned = temp.path().join("missing").join("native-2.8");
    let actual = canonical_state_plan(&planned).unwrap();
    assert_eq!(
        actual,
        fs::canonicalize(temp.path())
            .unwrap()
            .join("missing/native-2.8")
    );
    assert!(!planned.exists());
}
