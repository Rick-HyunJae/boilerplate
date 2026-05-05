#!/usr/bin/env python3
"""새 i18n 네임스페이스를 추가한다.

사용법:
    python add_namespace.py <project-root> <ns-name>

동작:
1. ko/<ns>.ts, en/<ns>.ts, ja/<ns>.ts 빈 파일 생성 (`export default {} as const;`).
2. i18n.ts 의 import 라인 + resources 객체 + ns 배열에 새 NS 자동 추가.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


CANDIDATE_LANG_DIRS = ['src/static/language', 'src/i18n']
LANGS = ['ko', 'en', 'ja']

EMPTY_NS_CONTENT = "export default {} as const;\n"


def find_language_root(project_root: Path) -> Path:
    for cand in CANDIDATE_LANG_DIRS:
        p = project_root / cand
        if (p / 'ko').is_dir() and (p / 'i18n.ts').exists() or (p / 'index.ts').exists():
            return p
    # ko 만 있고 i18n.ts/index.ts 없을 수도 있음 (mid-setup)
    for cand in CANDIDATE_LANG_DIRS:
        p = project_root / cand
        if (p / 'ko').is_dir():
            return p
    raise FileNotFoundError(f'language directory not found under {project_root}')


def to_pascal(name: str) -> str:
    return ''.join(part.capitalize() for part in re.split(r'[_\-]', name))


def update_i18n_entry(entry_path: Path, ns: str):
    text = entry_path.read_text(encoding='utf-8')
    pascal = to_pascal(ns)

    # 1) 각 언어 import 추가 — `import koCommon from './ko/common';` 같은 라인 뒤에
    for lang in LANGS:
        var = f'{lang}{pascal}'
        line = f"import {var} from './{lang}/{ns}';"
        if line in text:
            continue
        # 마지막 `from './<lang>/...';` 위치 뒤에 추가
        pattern = re.compile(rf"^(import \w+ from '\./{lang}/[^']+';)\s*$", re.M)
        matches = list(pattern.finditer(text))
        if matches:
            last = matches[-1]
            insert_at = last.end()
            text = text[:insert_at] + '\n' + line + text[insert_at:]
        else:
            # fallback: 파일 상단에 그냥 추가
            text = line + '\n' + text

    # 2) resources 객체에 NS 추가 — `<lang>: { ..., <ns>: <var> }`
    for lang in LANGS:
        var = f'{lang}{pascal}'
        # `ko: { ... }` 또는 `ko: { common: koCommon }` 등 매칭
        # 안전하게: `<lang>: {` 다음 첫 `}` 직전에 새 entry 삽입 (이미 있으면 스킵)
        if re.search(rf'\b{ns}\s*:\s*{var}\b', text):
            continue
        # 찾기: `<lang>: {`
        m = re.search(rf'\b{lang}\s*:\s*{{', text)
        if not m:
            print(f'WARN: {lang}: {{ entry not found in {entry_path.name}', file=sys.stderr)
            continue
        # 매칭되는 닫는 } 찾기
        depth = 1
        i = m.end()
        n = len(text)
        while i < n and depth > 0:
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    break
            i += 1
        # i 는 닫는 } 위치
        # entry insert: 들여쓰기 보존을 위해 닫는 } 앞 줄의 들여쓰기 채택
        # 단순화: 줄 단위로 마지막 비공백 라인 들여쓰기
        block = text[m.end():i]
        # 마지막 entry 뒤 콤마 처리
        # 새 라인 추가
        indent_match = re.search(r'^([ \t]+)\S', block, re.M)
        indent = indent_match.group(1) if indent_match else '\t\t'
        # 기존 마지막 entry 의 뒤에 콤마가 없으면 추가
        new_block = block.rstrip()
        if new_block and not new_block.rstrip().endswith(','):
            new_block += ','
        new_block += f'\n{indent}{ns}: {var}\n' + block[len(block.rstrip()):]
        text = text[:m.end()] + new_block + text[i:]

    # 3) `ns: [...]` 배열에 NS 추가
    ns_array_match = re.search(r"ns\s*:\s*\[([^\]]*)\]", text)
    if ns_array_match:
        inner = ns_array_match.group(1)
        if f"'{ns}'" not in inner and f'"{ns}"' not in inner:
            # 마지막 } 직전이 아닌 ] 직전에 추가
            new_inner = inner.rstrip()
            if new_inner and not new_inner.rstrip().endswith(','):
                new_inner += ', '
            else:
                new_inner = new_inner + ' ' if new_inner else ''
            new_inner += f"'{ns}'"
            text = text[:ns_array_match.start(1)] + new_inner + text[ns_array_match.end(1):]

    entry_path.write_text(text, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('project_root', type=Path)
    parser.add_argument('ns', help='new namespace name (e.g. studio)')
    args = parser.parse_args()

    if not re.fullmatch(r'[a-z][a-z0-9_]*', args.ns):
        print(f'ERROR: namespace must be [a-z][a-z0-9_]* (got "{args.ns}")', file=sys.stderr)
        sys.exit(1)

    project_root = args.project_root.resolve()
    try:
        lang_root = find_language_root(project_root)
    except FileNotFoundError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        sys.exit(1)

    # 1) 빈 NS 파일 생성
    for lang in LANGS:
        target = lang_root / lang / f'{args.ns}.ts'
        if target.exists():
            print(f'skip (exists): {target.relative_to(project_root)}')
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(EMPTY_NS_CONTENT, encoding='utf-8')
        print(f'created: {target.relative_to(project_root)}')

    # 2) i18n entry 갱신
    entry_candidates = [lang_root / 'i18n.ts', lang_root / 'index.ts']
    entry = next((p for p in entry_candidates if p.exists()), None)
    if not entry:
        print(f'WARN: no entry file (i18n.ts or index.ts) in {lang_root}; skipping registration')
    else:
        update_i18n_entry(entry, args.ns)
        print(f'updated: {entry.relative_to(project_root)}')

    print()
    print(f'done. add keys to {lang_root.relative_to(project_root)}/ko/{args.ns}.ts and run sync_keys.py.')


if __name__ == '__main__':
    main()
