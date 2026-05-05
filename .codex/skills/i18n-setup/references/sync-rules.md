# 다국어 동기화 규칙

ko 를 source 로 두고 en/ja 를 동기화하는 절차. `scripts/sync_keys.py` 의 동작을 명세.

## 원칙

- **ko 가 source of truth**. en/ja 는 ko 의 mirror.
- 사용자(또는 Claude) 는 ko 만 직접 편집한다.
- 동기화 스크립트가 en/ja 에 누락 키를 채우고, 한국어 원문 주석을 붙인다.
- 역방향 (en/ja 에만 존재) 키는 자동 삭제하지 않고 **경고만** 출력한다 — 의도된 케이스(번역자 단독 추가 등) 보호.

## 동기화 단계

```bash
python ~/.claude/skills/i18n-setup/scripts/sync_keys.py <project-root> [--check]
```

1. **언어 폴더 탐색** — `src/static/language/{ko,en,ja}` 또는 `src/i18n/{ko,en,ja}` 를 자동 인식.
2. **NS 별 처리** — ko 의 모든 `<ns>.ts` 파일을 기준으로:
   - ko 파일 파싱 → 키 트리 + 값 추출.
   - en/ja 의 동일 파일을 파싱.
   - ko 에만 있는 경로 = "추가 대상".
   - en/ja 에만 있는 경로 = "잔재 키" (경고).
3. **추가** — en/ja 에 누락 키를 동일 nested 위치에 삽입. 값은 ko 원문 그대로 (placeholder 표시).
4. **주석** — 추가된 키 바로 위 라인에 `// 한국어 원문: "<원문>"` 삽입.
5. **출력** — 변경 요약 (`<ns>: +N keys, ~M warnings`).

`--check` 옵션은 dry-run. 변경 없이 어떤 키가 추가될지 미리 보기.

## 한국어 원문 주석 컨벤션

en/ja 파일 예시 (sync 후):

```typescript
// en/common.ts
export default {
  button: {
    // 한국어 원문: "확인"
    confirm: 'OK',
    // 한국어 원문: "취소"
    cancel: 'Cancel',
    // 한국어 원문: "저장"  ← sync_keys 가 자동 삽입
    save: '저장'                ← 미번역 placeholder (값은 ko 원문 그대로)
  }
} as const;
```

미번역 키는 값이 한국어 원문으로 채워져 있고, 번역자가 추후 영문으로 교체. i18n-ally 가 이를 "미번역" 으로 표시한다.

## 새 NS 추가 시

키 동기화와 별개로 `add_namespace.py` 를 사용:

```bash
python ~/.claude/skills/i18n-setup/scripts/add_namespace.py <project-root> <ns-name>
```

- ko/en/ja 에 빈 `<ns>.ts` 생성 (`export default {} as const;`).
- `i18n.ts` 의 import 라인 + `resources` 객체 + `ns` 배열 자동 갱신.

## 변수 보간 일관성

`{{var}}` 의 변수 이름은 ko/en/ja 모두 동일해야 한다. sync_keys 는 키 추가만 하므로, ko 에서 변수명을 바꾸면 en/ja 의 값도 수동으로 맞춰줘야 한다 (또는 키를 새로 만들고 옛 키 폐기).

## 검증 명령

```bash
# 모든 언어의 키 셋이 동일한지 확인 (dry-run)
python ~/.claude/skills/i18n-setup/scripts/sync_keys.py <project-root> --check
```

출력에 `+0 keys` 가 모든 NS 에서 떠야 정상.

## 주의사항

- ko 파일의 들여쓰기·콤마 스타일을 유지하기 위해 sync_keys 는 텍스트 기반 삽입을 사용한다.
- 수동 편집한 en/ja 가 ko 와 형식이 너무 다르면 자동 삽입 위치가 어색할 수 있다 — 이 경우 sync 후 prettier 한 번 돌리는 것을 권장.
- sync_keys 실행 후 git diff 로 결과 확인 후 커밋.
