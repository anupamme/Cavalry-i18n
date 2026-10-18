"""
[INPUT]: 依赖 Python 编排层与模拟平台命令。
[OUTPUT]: 验证即时采集、异常收尾、平台隔离及整批回交；按本机Path身份比对路径，以显式UTF-8读取证据。
[POS]: 离线编排自测，不操作桌面或授予产品 PASS。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from run_flow import run, validate


class FlowTest(unittest.TestCase):
    def test_shared_receipt_uses_current_run_not_original_output(self):
        for system in ['macos', 'windows']:
            calls = []
            def invoke(command, **_):
                calls.append(command)
                return SimpleNamespace(returncode=0, stdout='', stderr='')
            with tempfile.TemporaryDirectory() as root:
                out = (Path(root) / 'resumed-run').resolve()
                plan = {'steps': [{'id': 'consumer', 'cases': ['a'], 'reads': '同批启动回执',
                                  'action': ['read', '{run}/launch/receipt.json', '{evidence}']}]}
                result = run(plan, out, system, invoke=invoke)
                self.assertTrue(result['completed'])
                self.assertEqual(len(calls), 1)
                self.assertEqual(calls[0][0], 'read')
                self.assertEqual(Path(calls[0][1]), out/'launch/receipt.json')
                self.assertEqual(Path(calls[0][2]), out/'consumer')

    def test_profile_handback_cannot_be_silently_bypassed(self):
        plan = {'profileHandback': 'same-language-helper', 'steps': [
            {'id': 'helper', 'cases': ['a'], 'reads': '状态', 'action': ['launch']}]}
        calls = []
        def invoke(command, **_):
            calls.append(command)
            return SimpleNamespace(returncode=0, stdout='', stderr='')
        with tempfile.TemporaryDirectory() as root:
            out = Path(root)/'run'
            with self.assertRaisesRegex(ValueError, '回交'):
                run(plan, out, 'macos', invoke=invoke)
            self.assertFalse(out.exists())
            self.assertEqual(calls, [])
            result = run(plan, out, 'macos', invoke=invoke, profile_handback_owner=True)
            self.assertTrue(result['completed'])
            self.assertEqual(calls, [['launch']])

    def test_interruption_still_closes_owned_process(self):
        calls = []
        def invoke(command, **_):
            calls.append(command)
            if command == ['action']:
                raise KeyboardInterrupt()
            return SimpleNamespace(returncode=0, stdout='', stderr='')
        with tempfile.TemporaryDirectory() as root:
            out = Path(root)/'run'
            result = run({'steps':[{'id':'interrupted','cases':['a'],'reads':'状态',
                                   'action':['action'],'cleanup':['close-owned-pid']}]},
                         out,'macos',invoke=invoke)
            self.assertEqual(calls,[['action'],['close-owned-pid']])
            self.assertFalse(result['completed'])
            self.assertEqual(json.loads((out/'events.jsonl').read_text(encoding='utf-8'))['error'], 'KeyboardInterrupt')

    def test_cleanup_runs_after_failed_action(self):
        calls = []
        def invoke(command, **_):
            calls.append(command)
            return SimpleNamespace(returncode=2 if command==['action'] else 0, stdout='', stderr='')
        with tempfile.TemporaryDirectory() as root:
            result=run({'steps':[{'id':'failure','cases':['a'],'reads':'状态',
                                 'action':['action'],'capture':['unused'],
                                 'cleanup':['close-owned-pid']}]},Path(root)/'run','macos',invoke=invoke)
            self.assertEqual(calls,[['action'],['close-owned-pid']])
            self.assertFalse(result['completed'])

    def test_cleanup_runs_after_success_and_action_timeout(self):
        for timed_out in [False, True]:
            with self.subTest(timed_out=timed_out):
                calls = []
                def invoke(command, **_):
                    calls.append(command)
                    if command == ['action'] and timed_out:
                        raise subprocess.TimeoutExpired(command, 1)
                    return SimpleNamespace(returncode=0, stdout='', stderr='')
                with tempfile.TemporaryDirectory() as root:
                    result = run({'steps': [{'id': 'finish', 'cases': ['a'], 'reads': '状态',
                                            'action': ['action'], 'cleanup': ['close-owned-pid']}]},
                                 Path(root)/'run', 'macos', invoke=invoke)
                    self.assertEqual(calls, [['action'], ['close-owned-pid']])
                    self.assertEqual(result['completed'], not timed_out)

    def test_cleanup_failure_does_not_close_the_batch(self):
        def invoke(command, **_):
            return SimpleNamespace(returncode=1 if command==['cleanup'] else 0,stdout='',stderr='')
        with tempfile.TemporaryDirectory() as root:
            result=run({'steps':[{'id':'close','cases':['a'],'reads':'状态',
                                 'action':['action'],'cleanup':['cleanup']}]},Path(root)/'run','macos',invoke=invoke)
            self.assertFalse(result['completed'])

    def test_ready_captures_immediately_on_both_platforms(self):
        for system in ['macos', 'windows']:
            calls, sleeps = [], []
            def invoke(command, **_):
                calls.append(command)
                return SimpleNamespace(returncode=0, stdout='actual-readback', stderr='')
            plan = {'steps': [{'id': 'menu', 'cases': ['menu-clock:comparison'],
                              'reads': '实际菜单可见状态和原图',
                              'action': {'macos': ['mac-menu'], 'windows': ['win-menu']},
                              'ready': ['probe-menu'], 'capture': ['capture', '{evidence}']}]}
            with tempfile.TemporaryDirectory() as root:
                out = Path(root)/'run'
                result = run(plan, out, system, invoke=invoke, sleep=sleeps.append)
                self.assertTrue(result['captured'])
                self.assertFalse(result['productPass'])
                self.assertEqual(calls[0], ['mac-menu' if system == 'macos' else 'win-menu'])
                self.assertEqual(calls[1], ['probe-menu'])
                self.assertEqual(calls[2][0], 'capture')
                self.assertEqual(sleeps, [])
                self.assertTrue((out/'events.jsonl').exists())
                self.assertTrue((out/'menu'/'002-capture.stdout').exists())

    def test_only_not_ready_polls_and_failure_stops(self):
        codes = iter([0, 1, 0, 2])
        calls, sleeps = [], []
        def invoke(command, **_):
            calls.append(command)
            return SimpleNamespace(returncode=next(codes), stdout='', stderr='')
        step = {'id': 'a', 'cases': ['a'], 'reads': '菜单', 'action': ['open'],
                'ready': ['probe'], 'capture': ['capture']}
        with tempfile.TemporaryDirectory() as root:
            out = Path(root)/'run'
            result = run({'steps': [step, {**step, 'id': 'b'}]}, out, 'macos', invoke=invoke, sleep=sleeps.append)
            self.assertFalse(result['captured'])
            self.assertEqual(result['executed'], 1)
            self.assertEqual(len(sleeps), 1)
            self.assertEqual(json.loads((out/'events.jsonl').read_text())['status'], 'FAILED')

    def test_windows_cannot_fall_back_to_mac_command(self):
        with self.assertRaisesRegex(ValueError, 'windows'):
            validate({'steps': [{'id': 'a', 'cases': ['a'], 'reads': '窗口',
                                 'action': {'macos': ['osascript']}}]}, 'windows')

    def test_evidence_does_not_enter_tracked_source(self):
        plan = {'steps': [{'id': 'a', 'cases': ['a'], 'reads': '状态', 'action': ['unused']}]}
        with self.assertRaisesRegex(ValueError, '仓库内证据'):
            run(plan, Path(__file__).parent/'should-not-exist', 'macos')

    def test_readback_only_does_not_claim_image_capture(self):
        def invoke(command, **_):
            return SimpleNamespace(returncode=0, stdout='locale=zh-Hant', stderr='')
        with tempfile.TemporaryDirectory() as root:
            out = Path(root)/'run'
            result = run({'steps': [{'id': 'locale', 'cases': ['loaded:zh-Hant'],
                                    'reads': '实际locale', 'action': ['read-locale']}]},
                         out, 'macos', invoke=invoke)
            self.assertTrue(result['completed'])
            self.assertFalse(result['captured'])
            self.assertEqual(json.loads((out/'events.jsonl').read_text())['status'], 'READBACK_PENDING_REVIEW')


if __name__ == '__main__':
    unittest.main()
