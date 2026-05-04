#!/usr/bin/env python3
"""ko 를 source 로 두고 en/ja 의 누락 키를 채운다.

사용법:
    python sync_keys.py <project-root> [--check]

동작:
1. <project-root>/src/static/language 또는 <project-root>/src/i18n 자동 인식.
2. ko 의 각 NS 파일을 기준으로 en/ja 에 누락 키 추가.
3. 추가된 키 위에는 // 한국어 원문: "..." 주석 자동 삽입.
4. en/ja 에만 있는 키는 경고만 출력.
5. --check: dry-run, 변경 없이 결과만 출력.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _ts_parser import (
    parse_locale_file,
    render_locale_file,
    merge_with_ko,
    diff_keys,
)


CANDIDATE_LANG_DIRS = [
    'src/static/language',
    'src/i18n',
]
TARGET_LANGS = ['en', 'ja']
SOURCE_LANG = 'ko'


def find_language_root(project_root: Path) -> Path:
    for cand in CANDIDATE_LANG_DIRS:
        p = project_root / cand
        if (p / SOURCE_LANG).is_dir():
            return p
    raise FileNotFoundError(
        f'language directory not found under {project_root}. '
        f'expected one of: {CANDIDATE_LANG_DIRS}'
    )


def list_namespaces(lang_root: Path) -> list[str]:
    ko_dir = lang_root / SOURCE_LANG
    return sorted(p.stem for p in ko_dir.glob('*.ts'))


def sync_namespace(lang_root: Path, ns: str, check: bool) -> dict:
    ko_path = lang_root / SOURCE_LANG / f'{ns}.ts'
    ko_tree = parse_locale_file(ko_path)

    summary: dict[str, dict] = {}
    for lang in TARGET_LANGS:
        target_path = lang_root / lang / f'{ns}.ts'
        if target_path.exists():
            target_tree = parse_locale_file(target_path)
        else:
            target_tree = {}

        missing, extra = diff_keys(ko_tree, target_tree)
        merged = merge_with_ko(ko_tree, target_tree)
        new_text = render_locale_file(merged, ko_tree=ko_tree)

        changed = (not target_path.exists()) or (target_path.read_text(encoding='utf-8') != new_text)
        if not check and changed:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(new_text, encoding='utf-8')

        summary[lang] = {
            'missing': missing,
            'extra': extra,
            'changed': changed,
        }
    return summary


def main():
    parser = argparse.ArgumentParser(description='Sync ko keys to en/ja.')
    parser.add_argument('project_root', type=Path)
    parser.add_argument('--check', action='store_true', help='dry-run')
    args = parser.parse_args()

    project_root = args.project_root.resolve()
    try:
        lang_root = find_language_root(project_root)
    except FileNotFoundError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        sys.exit(1)

    namespaces = list_namespaces(lang_root)
    if not namespaces:
        print(f'no namespace files in {lang_root / SOURCE_LANG}', file=sys.stderr)
        sys.exit(1)

    print(f'lang root: {lang_root}')
    print(f'namespaces: {namespaces}')
    print()

    total_added = 0
    total_warnings = 0
    for ns in namespaces:
        summary = sync_namespace(lang_root, ns, args.check)
        for lang, info in summary.items():
            added = len(info['missing'])
            extras = len(info['extra'])
            total_added += added
            total_warnings += extras
            mark = 'WOULD CHANGE' if (args.check and info['changed']) else (
                'CHANGED' if info['changed'] else 'unchanged'
            )
            print(f'  [{ns}] {lang}: +{added} keys, {extras} extra (only in {lang}) — {mark}')
            if info['extra']:
                for path in info['extra']:
                    print(f'      WARN extra in {lang}: {path}')
            if info['missing']:
                for path in info['missing']:
                    print(f'      added: {path}')

    print()
    if args.check:
        print(f'(dry-run) total: +{total_added} keys, {total_warnings} warnings')
    else:
        print(f'done: +{total_added} keys, {total_warnings} warnings')


if __name__ == '__main__':
    main()
