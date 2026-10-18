#!/usr/bin/env python3
"""
[INPUT]: 依赖动作计划、平台命令、就绪探针与显式整批回交方。
[OUTPUT]: 绑定本轮与步骤证据路径，顺序执行、采集及收尾。
[POS]: 双平台 Python 编排层；平台命令由计划指定，不自动授予产品 PASS。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""
import argparse
import json
import platform
import subprocess
import time
from pathlib import Path


def command_for(spec, system):
    """共用命令用数组；平台差异显式分支，不回退到另一平台。"""
    command = spec.get(system) if isinstance(spec, dict) else spec
    if not isinstance(command, list) or not command or not all(isinstance(x, str) for x in command):
        raise ValueError(f"缺少 {system} 命令数组")
    return command


def validate(plan, system):
    seen = set()
    if not plan.get('steps'):
        raise ValueError('计划缺少步骤')
    for step in plan['steps']:
        identity = step.get('id', '')
        if not identity or identity in seen or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in identity):
            raise ValueError('步骤 ID 必须唯一，且仅含字母、数字、连字符和下划线')
        seen.add(identity)
        if not step.get('reads') or not step.get('cases'):
            raise ValueError(f'{identity} 缺读取目标或表单检查项')
        command_for(step['action'], system)
        for key in ['ready', 'capture', 'cleanup']:
            if key in step:
                command_for(step[key], system)
        if step.get('timeout', 30) <= 0 or step.get('poll_interval', .1) <= 0:
            raise ValueError('超时和轮询间隔必须为正数')
    return len(seen)


def run(plan, out, system, invoke=subprocess.run, clock=time.monotonic, sleep=time.sleep,
        *, profile_handback_owner=False):
    validate(plan, system)
    if plan.get('profileHandback') and not profile_handback_owner:
        raise ValueError('计划要求整批回交；请使用拥有该回交职责的平台入口，不得直接实跑run_flow')
    out = Path(out).resolve()
    repo = Path(__file__).resolve().parents[2]
    ignored = [repo/'tools/acceptance/runs', repo/'tools/acceptance/local']
    if (repo == out or repo in out.parents) and not any(root in out.parents for root in ignored):
        raise ValueError('仓库内证据只写入 tools/acceptance/runs 或 local 的新子目录')
    out.mkdir(parents=True, exist_ok=False)
    (out / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    records = []
    for step in plan['steps']:
        started = clock()
        record = {'id': step['id'], 'cases': step['cases'], 'reads': step['reads'],
                  'platform': system, 'segments': [], 'waitSeconds': 0, 'status': 'RUNNING'}
        directory = out / step['id']
        directory.mkdir()
        outputs = []

        def execute(kind, spec, timeout):
            command = [x.replace('{evidence}', str(directory.resolve())).replace('{run}', str(out))
                       for x in command_for(spec, system)]
            before = clock()
            result = invoke(command, capture_output=True, text=True, timeout=timeout, check=False)
            index = len(record['segments'])
            outputs.append((index, kind, result.stdout or '', result.stderr or ''))
            record['segments'].append({'kind': kind, 'seconds': clock()-before, 'returncode': result.returncode})
            return result.returncode

        try:
            timeout = step.get('timeout', 30)
            if execute('action', step['action'], timeout):
                raise RuntimeError('动作失败')
            if 'ready' in step:
                deadline = clock() + timeout
                while True:
                    remaining = deadline - clock()
                    if remaining <= 0:
                        raise TimeoutError('未达到就绪条件')
                    code = execute('ready', step['ready'], remaining)
                    if code == 0:
                        break
                    if code != 1:
                        raise RuntimeError(f'就绪探针失败：{code}')
                    wait_started = clock()
                    sleep(min(step.get('poll_interval', .1), max(0, deadline-clock())))
                    record['waitSeconds'] += clock()-wait_started
            # 就绪后直接采集；OCR和人工判定放在采集批次之后。
            if 'capture' in step and execute('capture', step['capture'], timeout):
                raise RuntimeError('采集失败')
            record['status'] = 'CAPTURED_PENDING_REVIEW' if 'capture' in step else 'READBACK_PENDING_REVIEW'
        except (OSError, RuntimeError, subprocess.SubprocessError, TimeoutError, KeyboardInterrupt) as error:
            record['status'] = 'FAILED'
            record['error'] = str(error) or type(error).__name__
        if 'cleanup' in step:
            try:
                if execute('cleanup', step['cleanup'], step.get('cleanup_timeout', 10)):
                    raise RuntimeError('本步骤测试进程清理失败')
            except (OSError, RuntimeError, subprocess.SubprocessError, TimeoutError) as error:
                record['status'] = 'FAILED'
                record['cleanupError'] = str(error)
        record['seconds'] = clock()-started
        # 日志批量落盘后置，不让写日志阻塞就绪后的即时截图。
        archive_started = clock()
        for index, kind, stdout, stderr in outputs:
            (directory / f'{index:03d}-{kind}.stdout').write_text(stdout, encoding='utf-8')
            if stderr:
                (directory / f'{index:03d}-{kind}.stderr').write_text(stderr, encoding='utf-8')
        record['archiveSeconds'] = clock()-archive_started
        records.append(record)
        with (out / 'events.jsonl').open('a', encoding='utf-8') as stream:
            stream.write(json.dumps(record, ensure_ascii=False)+'\n')
        if record['status'] == 'FAILED':
            break
    summary = {'platform': system, 'executed': len(records), 'planned': len(plan['steps']),
               'completed': len(records) == len(plan['steps']) and all(r['status'] != 'FAILED' for r in records),
               'captured': all(r['status'] == 'CAPTURED_PENDING_REVIEW' for r in records),
               'seconds': sum(r['seconds'] for r in records), 'productPass': False}
    (out / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    return summary


def main():
    parser = argparse.ArgumentParser(description='双平台动作编排；采集成功不等于产品通过')
    parser.add_argument('plan', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--check', action='store_true', help='仅核本平台步骤，不执行动作')
    args = parser.parse_args()
    system = {'Darwin': 'macos', 'Windows': 'windows'}.get(platform.system())
    if system is None:
        parser.error('实跑只支持 macOS 或 Windows')
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    if args.check:
        print(json.dumps({'platform': system, 'steps': validate(plan, system), 'executed': False}))
        return 0
    if not args.out:
        parser.error('实跑必须指定新证据目录 --out')
    result = run(plan, args.out, system)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['completed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
