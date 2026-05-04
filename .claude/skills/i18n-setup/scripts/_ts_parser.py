"""i18n 리소스 TS 파일 (limited subset) 파싱·렌더링 헬퍼.

지원:
- export default { ... } as const;
- nested object literals
- string values (single/double quote, backtick — multiline 백틱 포함)
- 표현식 값(메서드 호출, 연결, 변수 참조 등) — raw text 로 보존
- unquoted / quoted keys
- // line comments, /* block comments */ (값 위 주석은 보존하지 않고, 렌더 시 한국어 원문 주석으로 자동 생성)
- trailing commas
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union


@dataclass
class RawValue:
    """파싱하지 않고 raw text 로 보존하는 표현식 값."""
    text: str


# 트리 값 타입: str (단순 문자열), dict (nested), RawValue (표현식)
TreeValue = Union[str, dict, RawValue]


@dataclass
class Token:
    kind: str   # 'lbrace','rbrace','lparen','rparen','lbracket','rbracket','colon','comma','semi','string','ident','raw'
    value: str
    raw: str    # 원본 텍스트 슬라이스 (raw expression 재구성용)
    pos: int


_IDENT_RE = re.compile(r'[A-Za-z_$][\w$]*')
_NUM_RE = re.compile(r'\d+(\.\d+)?')


def _tokenize(src: str) -> list[Token]:
    tokens: list[Token] = []
    i = 0
    n = len(src)

    while i < n:
        c = src[i]
        # whitespace
        if c.isspace():
            i += 1
            continue
        # line comment
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            j = src.find('\n', i)
            i = j if j != -1 else n
            continue
        # block comment
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            if j == -1:
                raise SyntaxError(f'unterminated block comment at {i}')
            i = j + 2
            continue
        # string literals (single, double, backtick)
        if c in ('"', "'", '`'):
            quote = c
            j = i + 1
            buf: list[str] = []
            while j < n:
                ch = src[j]
                if ch == '\\' and j + 1 < n:
                    nxt = src[j + 1]
                    escape_map = {'n': '\n', 't': '\t', 'r': '\r', '\\': '\\',
                                  "'": "'", '"': '"', '`': '`', '/': '/'}
                    if nxt in escape_map:
                        buf.append(escape_map[nxt])
                        j += 2
                        continue
                    buf.append(nxt)
                    j += 2
                    continue
                if ch == quote:
                    break
                # template literal 은 multiline 허용
                if ch == '\n' and quote != '`':
                    raise SyntaxError(f'unterminated string at {i}')
                buf.append(ch)
                j += 1
            if j >= n:
                raise SyntaxError(f'unterminated string at {i}')
            raw = src[i:j + 1]
            tokens.append(Token('string', ''.join(buf), raw, i))
            i = j + 1
            continue
        # regex literal — 컨텍스트 의존이라 단순 휴리스틱: `/` 뒤에 식별자나 숫자가 아니고 직전 토큰이 연산자성이면 regex.
        # 여기서는 안전한 검출이 어려우므로 raw 로 처리.
        # 단순 punctuation
        if c == '{':
            tokens.append(Token('lbrace', c, c, i))
            i += 1
            continue
        if c == '}':
            tokens.append(Token('rbrace', c, c, i))
            i += 1
            continue
        if c == '(':
            tokens.append(Token('lparen', c, c, i))
            i += 1
            continue
        if c == ')':
            tokens.append(Token('rparen', c, c, i))
            i += 1
            continue
        if c == '[':
            tokens.append(Token('lbracket', c, c, i))
            i += 1
            continue
        if c == ']':
            tokens.append(Token('rbracket', c, c, i))
            i += 1
            continue
        if c == ':':
            tokens.append(Token('colon', c, c, i))
            i += 1
            continue
        if c == ',':
            tokens.append(Token('comma', c, c, i))
            i += 1
            continue
        if c == ';':
            tokens.append(Token('semi', c, c, i))
            i += 1
            continue
        # 숫자 — 키로도, 표현식으로도 사용 가능
        m = _NUM_RE.match(src, i)
        if m:
            tokens.append(Token('number', m.group(0), m.group(0), i))
            i = m.end()
            continue
        # 식별자
        m = _IDENT_RE.match(src, i)
        if m:
            tokens.append(Token('ident', m.group(0), m.group(0), i))
            i = m.end()
            continue
        # 정규식 / regex literal 휴리스틱: 직전 토큰이 연산자성(`raw`, `comma`, `lparen`, `colon`, `lbrace`, `lbracket`, none) 이면 regex 로 본다
        if c == '/':
            prev = tokens[-1] if tokens else None
            could_be_regex = prev is None or prev.kind in (
                'comma', 'lparen', 'colon', 'lbrace', 'lbracket', 'semi'
            ) or (prev.kind == 'raw' and prev.value in (
                '+', '-', '*', '/', '%', '!', '=', '<', '>', '&', '|', '?', '~', '^'
            ))
            if could_be_regex:
                # /pattern/flags
                j = i + 1
                in_class = False
                while j < n:
                    ch = src[j]
                    if ch == '\\' and j + 1 < n:
                        j += 2
                        continue
                    if ch == '[':
                        in_class = True
                    elif ch == ']':
                        in_class = False
                    elif ch == '/' and not in_class:
                        break
                    elif ch == '\n':
                        raise SyntaxError(f'unterminated regex at {i}')
                    j += 1
                if j >= n:
                    raise SyntaxError(f'unterminated regex at {i}')
                # consume flags
                k = j + 1
                while k < n and src[k].isalpha():
                    k += 1
                tokens.append(Token('raw', src[i:k], src[i:k], i))
                i = k
                continue
        # 기타 문자 (연산자 등) — raw 로
        tokens.append(Token('raw', c, c, i))
        i += 1

    tokens.append(Token('eof', '', '', n))
    return tokens


def _is_value_terminator(tok: Token, depth_paren: int, depth_brace: int, depth_bracket: int) -> bool:
    if depth_paren == 0 and depth_brace == 0 and depth_bracket == 0:
        return tok.kind in ('comma', 'rbrace', 'eof')
    return False


def _slurp_expression(tokens: list[Token], idx: int, src: str) -> tuple[str, int]:
    """object 의 entry value 위치에서 시작하여, 다음 top-level ','/'}' 직전까지 토큰을 텍스트로 슬러프."""
    start = tokens[idx].pos
    depth_paren = 0
    depth_brace = 0
    depth_bracket = 0
    j = idx
    while j < len(tokens):
        t = tokens[j]
        if t.kind == 'eof':
            break
        if _is_value_terminator(t, depth_paren, depth_brace, depth_bracket):
            break
        if t.kind == 'lparen':
            depth_paren += 1
        elif t.kind == 'rparen':
            depth_paren -= 1
        elif t.kind == 'lbrace':
            depth_brace += 1
        elif t.kind == 'rbrace':
            depth_brace -= 1
        elif t.kind == 'lbracket':
            depth_bracket += 1
        elif t.kind == 'rbracket':
            depth_bracket -= 1
        j += 1
    # j 는 종결 위치
    end = tokens[j].pos if j < len(tokens) else len(src)
    raw = src[start:end].strip()
    return raw, j


def _parse_object(tokens: list[Token], idx: int, src: str) -> tuple[dict, int]:
    if tokens[idx].kind != 'lbrace':
        raise SyntaxError(f'expected {{ at pos {tokens[idx].pos}')
    idx += 1
    result: dict = {}
    while tokens[idx].kind != 'rbrace':
        if tokens[idx].kind == 'comma':
            idx += 1
            continue
        if tokens[idx].kind not in ('ident', 'string', 'number'):
            raise SyntaxError(
                f'expected key at pos {tokens[idx].pos} (got {tokens[idx].kind} "{tokens[idx].value}")'
            )
        key = tokens[idx].value
        idx += 1
        if tokens[idx].kind != 'colon':
            raise SyntaxError(f'expected : after key at pos {tokens[idx].pos}')
        idx += 1
        # value
        if tokens[idx].kind == 'lbrace':
            # 분기: nested object 인지, 단순 brace expression 인지 — i18n 리소스에서 단순 obj 로 가정
            sub, idx = _parse_object(tokens, idx, src)
            # 객체 뒤에 ., (, 등이 붙으면 expression — 다시 슬러프
            if tokens[idx].kind in ('raw', 'lparen', 'lbracket') and tokens[idx].kind != 'rbrace':
                # 이미 객체 끝났는데 추가 토큰? 거의 없음. 무시.
                pass
            result[key] = sub
        elif tokens[idx].kind == 'string':
            # 단순 string 리터럴이지만, 뒤에 표현식이 붙는지 확인 (`'foo' + bar` 같은 경우)
            # peek next non-comment token
            next_tok = tokens[idx + 1] if idx + 1 < len(tokens) else None
            if next_tok and next_tok.kind in ('raw',) and next_tok.value not in (',',):
                # expression — slurp
                raw, idx = _slurp_expression(tokens, idx, src)
                result[key] = RawValue(raw)
            elif next_tok and next_tok.kind == 'lparen':
                # 메서드 호출 시작 — 그러나 string 직후 ( 는 거의 없고, '...' . method 가 일반적
                raw, idx = _slurp_expression(tokens, idx, src)
                result[key] = RawValue(raw)
            elif next_tok and next_tok.kind in ('comma', 'rbrace'):
                result[key] = tokens[idx].value
                idx += 1
            else:
                # 안전하게 표현식으로 간주
                raw, idx = _slurp_expression(tokens, idx, src)
                # 만약 raw 가 이 string 자체와 동일하다면 단순 문자열로 저장
                if raw == tokens[idx - 0 - 1].raw if False else False:
                    pass
                # raw 길이가 string raw 와 같으면 단순 문자열
                # (위 분기로 이미 처리됨)
                result[key] = RawValue(raw)
        else:
            # 표현식 (식별자, 숫자, 백틱 멀티라인 같은 다른 시작)
            raw, idx = _slurp_expression(tokens, idx, src)
            result[key] = RawValue(raw)

        if tokens[idx].kind == 'comma':
            idx += 1
    idx += 1  # consume rbrace
    return result, idx


def parse_locale_file(path: Path) -> dict:
    src = path.read_text(encoding='utf-8')
    tokens = _tokenize(src)
    i = 0
    while i < len(tokens) and tokens[i].kind != 'lbrace':
        i += 1
    if i >= len(tokens):
        raise SyntaxError(f'no object literal found in {path}')
    obj, _ = _parse_object(tokens, i, src)
    return obj


def _escape_single_quote(s: str) -> str:
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def _is_valid_ident(s: str) -> bool:
    return bool(re.fullmatch(r'[A-Za-z_$][\w$]*', s))


def _is_numeric_key(s: str) -> bool:
    return bool(re.fullmatch(r'\d+(\.\d+)?', s))


def render_locale_file(
    tree: dict,
    ko_tree: dict | None = None,
    indent: str = '\t',
) -> str:
    lines: list[str] = ['export default {']

    def render_value_inline(v: TreeValue, depth: int, ko_v: TreeValue | None) -> str:
        if isinstance(v, dict):
            return ''  # not used here
        if isinstance(v, RawValue):
            return v.text
        return f"'{_escape_single_quote(str(v))}'"

    def render_obj(obj: dict, ko_obj: dict | None, depth: int):
        keys = list(obj.keys())
        for i, k in enumerate(keys):
            v = obj[k]
            ko_v = (ko_obj.get(k) if isinstance(ko_obj, dict) else None)
            if _is_valid_ident(k) or _is_numeric_key(k):
                key_repr = k
            else:
                key_repr = f"'{_escape_single_quote(k)}'"
            prefix = indent * depth
            is_last = i == len(keys) - 1
            tail = '' if is_last else ','
            if isinstance(v, dict):
                lines.append(f'{prefix}{key_repr}: {{')
                render_obj(v, ko_v if isinstance(ko_v, dict) else None, depth + 1)
                lines.append(f'{prefix}}}{tail}')
            else:
                # leaf — string or RawValue
                if isinstance(ko_v, str):
                    safe = ko_v.replace('"', '\\"').replace('\n', ' ')
                    lines.append(f'{prefix}// 한국어 원문: "{safe}"')
                rendered = render_value_inline(v, depth, ko_v)
                lines.append(f'{prefix}{key_repr}: {rendered}{tail}')

    render_obj(tree, ko_tree, 1)
    lines.append('} as const;')
    return '\n'.join(lines) + '\n'


def merge_with_ko(ko_tree: dict, target_tree: dict) -> dict:
    """ko 의 모든 키 구조에 맞춰 target 을 채운다.

    - ko 에 있고 target 에 없으면 ko 값을 placeholder 로 사용.
    - target 에 있는 값은 그대로 보존.
    - target 에만 있는 키도 보존 (사용자 의도일 수 있음).
    """
    result: dict = {}
    for k, v in ko_tree.items():
        if isinstance(v, dict):
            sub_target = target_tree.get(k) if isinstance(target_tree.get(k), dict) else {}
            result[k] = merge_with_ko(v, sub_target)
        else:
            existing = target_tree.get(k)
            if existing is not None and not isinstance(existing, dict):
                result[k] = existing
            else:
                result[k] = v
    for k, v in target_tree.items():
        if k not in result:
            result[k] = v
    return result


def diff_keys(ko_tree: dict, target_tree: dict, prefix: str = '') -> tuple[list[str], list[str]]:
    missing: list[str] = []
    extra: list[str] = []
    ko_keys = set(ko_tree.keys())
    target_keys = set(target_tree.keys())

    for k in ko_keys:
        path = f'{prefix}.{k}' if prefix else k
        if k not in target_keys:
            if isinstance(ko_tree[k], dict):
                _collect_all_paths(ko_tree[k], path, missing)
            else:
                missing.append(path)
        else:
            if isinstance(ko_tree[k], dict) and isinstance(target_tree[k], dict):
                m, e = diff_keys(ko_tree[k], target_tree[k], path)
                missing.extend(m)
                extra.extend(e)

    for k in target_keys - ko_keys:
        path = f'{prefix}.{k}' if prefix else k
        if isinstance(target_tree[k], dict):
            _collect_all_paths(target_tree[k], path, extra)
        else:
            extra.append(path)

    return missing, extra


def _collect_all_paths(obj: dict, prefix: str, out: list[str]):
    for k, v in obj.items():
        path = f'{prefix}.{k}'
        if isinstance(v, dict):
            _collect_all_paths(v, path, out)
        else:
            out.append(path)
