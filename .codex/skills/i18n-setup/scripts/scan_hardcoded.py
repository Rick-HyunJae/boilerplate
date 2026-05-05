#!/usr/bin/env python3
"""TS/TSX/JS/JSX 파일에서 하드코딩된 한글·영문 UI 문자열 후보를 탐지.

사용법:
    python scan_hardcoded.py <project-root> [--ext tsx,ts,jsx,js] [--include-ascii]

기본은 한글 검출. --include-ascii 추가 시 영문 UI 라벨 후보도 (휴리스틱) 보고.

보고만 하고 편집은 하지 않는다. 결과를 보고 Claude 가 NS·키 결정·import 추가·변환을 처리.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


KOREAN_RE = re.compile(r'[가-힣]')
HANGUL_BLOCK_RE = re.compile(r'[가-힣][가-힣\s\.,!\?\(\)·~\d%a-zA-Z]*[가-힣\.\?!]')

# JSX text node 안의 한글
JSX_TEXT_KOREAN_RE = re.compile(r'>([^<>{}\n]*[가-힣][^<>{}\n]*)<')

# 텍스트 속성 안의 한글
ATTR_KOREAN_RE = re.compile(
    r'(?:placeholder|title|alt|aria-label|tooltip|label)\s*=\s*["\']([^"\']*[가-힣][^"\']*)["\']'
)

# 일반 string literal 안의 한글 (단순 패턴; method chain 후보 포함)
STRING_KOREAN_RE = re.compile(r'["\'`]([^"\'`\n]*[가-힣][^"\'`\n]*)["\'`]')

EXCLUDED_DIRS = {
    'node_modules', '.git', 'dist', 'build', 'out', '.next', '.cache',
    '__pycache__', '.venv', 'venv', '.pytest_cache',
}

# 다음 경로의 파일은 스캔 대상 제외 (i18n 리소스 자체)
EXCLUDED_PATH_PARTS = ('static/language/', '/i18n/ko/', '/i18n/en/', '/i18n/ja/')


def should_skip_file(path: Path) -> bool:
    s = str(path)
    if any(part in s for part in EXCLUDED_PATH_PARTS):
        return True
    return False


def iter_source_files(root: Path, exts: list[str]):
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if path.suffix.lstrip('.').lower() not in exts:
            continue
        if any(part in EXCLUDED_DIRS for part in path.parts):
            continue
        if should_skip_file(path):
            continue
        yield path


def scan_file(path: Path, include_ascii: bool) -> list[tuple[int, str, str]]:
    """returns list of (line_number, kind, text)."""
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        return []
    findings: list[tuple[int, str, str]] = []

    for lineno, line in enumerate(text.splitlines(), start=1):
        # JSX text
        for m in JSX_TEXT_KOREAN_RE.finditer(line):
            content = m.group(1).strip()
            if content:
                findings.append((lineno, 'jsx-text', content))
        # 속성
        for m in ATTR_KOREAN_RE.finditer(line):
            findings.append((lineno, 'attr', m.group(1)))
        # 일반 string (위 패턴에서 잡힌 것 외)
        for m in STRING_KOREAN_RE.finditer(line):
            content = m.group(1)
            # 이미 t() 호출이거나 'ns:key' 패턴이면 스킵
            ctx = line[max(0, m.start() - 4):m.start()]
            if 't(' in ctx or 'looseT(' in ctx or 'i18n.t(' in ctx:
                continue
            if ':' in content and re.match(r'^[\w\-]+:[\w\.\-]+$', content):
                continue
            findings.append((lineno, 'string', content))
    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('project_root', type=Path)
    parser.add_argument('--ext', default='tsx,ts,jsx,js')
    parser.add_argument('--include-ascii', action='store_true',
                        help='영문 UI 라벨 후보도 보고 (휴리스틱, false positive 많음)')
    args = parser.parse_args()

    root = args.project_root.resolve()
    if not root.is_dir():
        print(f'ERROR: {root} is not a directory', file=sys.stderr)
        sys.exit(1)

    exts = [e.strip().lstrip('.') for e in args.ext.split(',')]
    total = 0
    files_with_hits = 0
    for path in iter_source_files(root, exts):
        hits = scan_file(path, args.include_ascii)
        if not hits:
            continue
        files_with_hits += 1
        rel = path.relative_to(root)
        for lineno, kind, text in hits:
            total += 1
            short = text if len(text) <= 80 else text[:77] + '...'
            print(f'{rel}:{lineno}\t[{kind}]\t{short}')

    print()
    print(f'total: {total} hardcoded korean strings in {files_with_hits} files')
    if total > 0:
        print('next: convert each to t("ns:key") and add the key to src/static/language/ko/<ns>.ts')


if __name__ == '__main__':
    main()
