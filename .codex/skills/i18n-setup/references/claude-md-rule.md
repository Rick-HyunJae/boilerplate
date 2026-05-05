# 프로젝트 CLAUDE.md 에 주입할 규칙 블록

setup 모드 마지막 단계에서, 대상 프로젝트의 루트 `CLAUDE.md` 끝에 아래 블록을 그대로 append 한다. CLAUDE.md 가 없으면 새로 생성.

이 블록의 목적: skill trigger 가 누락된 상황에서도 Claude 가 코드 작성 중 i18n 을 자동 적용하도록 강제.

---

## 주입할 블록 (이 펜스 사이를 그대로 복사)

```markdown
## i18n 규칙

이 프로젝트는 i18next 기반 다국어 시스템을 사용한다 (ko / en / ja). 코드 작성·수정 시 다음을 엄수:

- **하드코딩 금지** — UI 에 노출되는 어떤 언어 문자열도 코드에 직접 작성 금지. 반드시 `t('ns:key')` 사용.
- **NS 선택** — 파일 경로 도메인을 따른다. Studio→studio, Artboard→artboard, Knowledge→knowledge, Deployment→deployment, Dialogs→dialogs, 그 외 공통→common. 해당 NS 가 없으면 `python ~/.claude/skills/i18n-setup/scripts/add_namespace.py . <ns>` 로 먼저 생성.
- **키 작명** — camelCase + 카테고리 prefix (`button.save`, `messages.saveSuccess`). 의미상 동일한 기존 키가 있으면 재사용.
- **ko 만 편집** — `src/static/language/ko/<ns>.ts` 또는 `src/i18n/ko/<ns>.ts` 에만 키 추가. en/ja 는 직접 손대지 말 것.
- **작업 종료 직전 동기화** — 새 키를 추가했다면 반드시 다음 명령을 실행해 en/ja 동기화:
  ```bash
  python ~/.claude/skills/i18n-setup/scripts/sync_keys.py .
  ```
- **변수 보간** — 동적 부분은 `{{var}}` 로 추출 후 `t('ns:key', { var })`. 문자열 합성 금지.
- **상수 파일** — 번역값이 아니라 `'ns:key'` 형태의 키 문자열만 저장. 렌더링 시점에 `t(item.labelKey)`.
- **React 외부** — utils/axios 등에서 i18n.t 호출 시, 모듈 최상단이 아니라 함수 내부에서. `import i18n from '~language/i18n'`.
- **동적 키** — 런타임 키 변환이 필요한 곳만 `useLooseTranslation` 의 `looseT`. 정적 키에는 사용 금지.
- **하드코딩 탐지** — 기존 코드 정리 시 `python ~/.claude/skills/i18n-setup/scripts/scan_hardcoded.py .` 로 후보를 확인.

자세한 컨벤션은 `~/.claude/skills/i18n-setup/references/conventions.md` 참고.
```

---

## 적용 절차

1. 프로젝트 루트에 `CLAUDE.md` 가 있는지 확인.
2. 있으면: 파일 끝에 빈 줄 1개 + 위 블록을 append.
3. 없으면: `CLAUDE.md` 를 새로 만들고 첫 줄에 프로젝트명을 # 헤더로, 그 다음에 위 블록.
4. 이미 `## i18n 규칙` 섹션이 있으면 덮어쓰지 말고 사용자에게 diff 안내 후 합치기 여부 확인.
