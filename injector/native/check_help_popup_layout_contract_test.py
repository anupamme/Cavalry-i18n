"""
[INPUT]: 依赖arm Popup静态checker的alias断言。
[OUTPUT]: 锁定arm64使用公共popup_abi，拒绝x86_64 alias误接线。
[POS]: Popup checker的离线源合同测试；不调用vendor工具或候选构建。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
from __future__ import annotations

import unittest

from check_help_popup_layout_contract import arm_popup_adapter_contract


ARM_ADAPTER = """\
#if defined(__x86_64__)
namespace popup_abi = native_help_popup_layout::abi::x86_64;
constexpr const char *kPopupUiUuid = popup_abi::kCavalryUiUuid;
#else
namespace popup_abi = native_help_popup_layout::abi;
namespace help_abi = native_help_description::contract;
#endif
gExpectedReturn.store(imageAddress(ui, popup_abi::kActivateReturnOffset));
isExactActivationCaller(caller, expected);
original(layout);
"""


class HelpPopupLayoutCheckerTest(unittest.TestCase):
    def test_accepts_explicit_arm_popup_alias_and_use(self) -> None:
        self.assertTrue(arm_popup_adapter_contract(ARM_ADAPTER))

    def test_rejects_x86_alias_in_arm_branch(self) -> None:
        wrong_alias = ARM_ADAPTER.replace(
            "#else\nnamespace popup_abi = native_help_popup_layout::abi;",
            "#else\nnamespace popup_abi = native_help_popup_layout::abi::x86_64;",
        )
        self.assertFalse(arm_popup_adapter_contract(wrong_alias))

    def test_rejects_missing_return_address_publication(self) -> None:
        self.assertFalse(arm_popup_adapter_contract(
            ARM_ADAPTER.replace("gExpectedReturn.store", "unusedValue")))

    def test_rejects_generic_abi_return_address(self) -> None:
        wrong_use = ARM_ADAPTER.replace(
            "imageAddress(ui, popup_abi::kActivateReturnOffset)",
            "imageAddress(ui, abi::kActivateReturnOffset)",
        )
        self.assertFalse(arm_popup_adapter_contract(wrong_use))


if __name__ == "__main__":
    unittest.main()
