/**
 * [INPUT]: 依赖 CommandRunner 的受控 detached process 端口；只接收编译期枚举 ProjectLink，不接收 renderer URL。
 * [OUTPUT]: 提供 ProjectLink::from_id 与 open_project_link，将Twitter/X关注、小红书、repository/license/bug report/2.7.2历史版映射为固定 HTTPS 地址并交给平台默认浏览器。
 * [POS]: privilege 的最小外部导航适配器；守住任意 URL 不跨越 renderer 边界，复用现有系统进程抽象而不引入 opener 依赖。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::CommandRunner;

const TWITTER_URL: &str = "https://x.com/intent/follow?user_id=871000155767488513";
const XIAOHONGSHU_URL: &str = "https://www.xiaohongshu.com/user/profile/5f4696c800000000010011f6";
const REPOSITORY_URL: &str = "https://github.com/daftAI2026/Cavalry-i18n";
const LICENSE_URL: &str = "https://github.com/daftAI2026/Cavalry-i18n/blob/main/LICENSE";
const REPORT_ISSUE_URL: &str =
    "https://github.com/daftAI2026/Cavalry-i18n/issues/new?template=bug_report.yml";

const LEGACY_RELEASE_URL: &str =
    "https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProjectLink {
    Twitter,
    Xiaohongshu,
    Repository,
    License,
    ReportIssue,
    LegacyRelease,
}

impl ProjectLink {
    pub fn from_id(id: &str) -> Option<Self> {
        match id {
            "twitter" => Some(Self::Twitter),
            "xiaohongshu" => Some(Self::Xiaohongshu),
            "repository" => Some(Self::Repository),
            "license" => Some(Self::License),
            "reportIssue" => Some(Self::ReportIssue),
            "legacyRelease" => Some(Self::LegacyRelease),
            _ => None,
        }
    }

    fn url(self) -> &'static str {
        match self {
            Self::Twitter => TWITTER_URL,
            Self::Xiaohongshu => XIAOHONGSHU_URL,
            Self::Repository => REPOSITORY_URL,
            Self::License => LICENSE_URL,
            Self::ReportIssue => REPORT_ISSUE_URL,
            Self::LegacyRelease => LEGACY_RELEASE_URL,
        }
    }
}

pub fn open_project_link<R: CommandRunner>(
    link: ProjectLink,
    runner: &mut R,
) -> Result<(), String> {
    let url = link.url().to_string();

    #[cfg(target_os = "macos")]
    return runner.spawn_detached("open", &[url]);

    #[cfg(target_os = "windows")]
    return runner.spawn_detached(
        "rundll32.exe",
        &["url.dll,FileProtocolHandler".to_string(), url],
    );

    #[cfg(target_os = "linux")]
    return runner.spawn_detached("xdg-open", &[url]);

    #[allow(unreachable_code)]
    Err("Opening project links is unsupported on this platform.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privilege::RecordingRunner;

    #[test]
    fn project_link_ids_are_closed_and_urls_are_compile_time_fixed() {
        assert_eq!(ProjectLink::from_id("twitter"), Some(ProjectLink::Twitter));
        assert_eq!(
            ProjectLink::from_id("xiaohongshu"),
            Some(ProjectLink::Xiaohongshu)
        );
        assert_eq!(
            ProjectLink::from_id("repository"),
            Some(ProjectLink::Repository)
        );
        assert_eq!(ProjectLink::from_id("license"), Some(ProjectLink::License));
        assert_eq!(
            ProjectLink::from_id("reportIssue"),
            Some(ProjectLink::ReportIssue)
        );
        assert_eq!(ProjectLink::from_id("https://attacker.invalid"), None);
        assert_eq!(
            ProjectLink::Twitter.url(),
            "https://x.com/intent/follow?user_id=871000155767488513"
        );
        assert_eq!(
            ProjectLink::Xiaohongshu.url(),
            "https://www.xiaohongshu.com/user/profile/5f4696c800000000010011f6"
        );
        assert_eq!(ProjectLink::Repository.url(), REPOSITORY_URL);
        assert_eq!(ProjectLink::License.url(), LICENSE_URL);
        assert_eq!(ProjectLink::ReportIssue.url(), REPORT_ISSUE_URL);
    }

    #[test]
    fn legacy_release_does_not_follow_latest_or_accept_renderer_urls() {
        assert_eq!(
            ProjectLink::from_id("legacyRelease"),
            Some(ProjectLink::LegacyRelease)
        );
        assert_eq!(
            ProjectLink::LegacyRelease.url(),
            "https://github.com/daftAI2026/Cavalry-i18n/releases/tag/cavalry-2.7.2-p12"
        );
        let mut runner = RecordingRunner::default();
        open_project_link(ProjectLink::LegacyRelease, &mut runner).unwrap();
        assert!(runner.commands[0]
            .args
            .iter()
            .any(|a| a.ends_with("/cavalry-2.7.2-p12")));
    }

    #[test]
    fn project_link_uses_the_platform_browser_adapter() {
        for (link, expected_url) in [
            (ProjectLink::ReportIssue, REPORT_ISSUE_URL),
            (ProjectLink::Twitter, TWITTER_URL),
            (ProjectLink::Xiaohongshu, XIAOHONGSHU_URL),
        ] {
            let mut runner = RecordingRunner::default();
            open_project_link(link, &mut runner).unwrap();
            assert_eq!(runner.commands.len(), 1);
            assert!(runner.commands[0]
                .args
                .iter()
                .any(|arg| arg == expected_url));
            #[cfg(target_os = "macos")]
            assert_eq!(runner.commands[0].program, "open");
            #[cfg(target_os = "windows")]
            assert_eq!(runner.commands[0].program, "rundll32.exe");
            #[cfg(target_os = "linux")]
            assert_eq!(runner.commands[0].program, "xdg-open");
        }
    }
}
