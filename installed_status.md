# Claude Code 환경 설정 가이드

> 이 문서는 프로젝트의 Claude Code 환경 설정 상태를 기록합니다.  
> 다른 팀원이 동일한 환경을 구축할 수 있도록 작성되었습니다.

## 📋 목차

- [환경 개요](#환경-개요)
- [User Scope 설정](#user-scope-설정)
- [Project Scope 설정](#project-scope-설정)
- [설정 방법](#설정-방법)
- [설정 파일 전문](#설정-파일-전문)

---

## 환경 개요

### 📊 비교 요약

| 구분 | User Scope | Project Scope |
|------|-----------|---------------|
| **Enabled Plugins** | 7개 | 2개 |
| **Disabled Plugins** | - | 3개 |
| **MCPs** | - | 1개 |
| **Skill Overrides** | 15개 | - |
| **Known Marketplaces** | 3개 | - |

---

## User Scope 설정

**경로**: `~/.claude/settings.json`

### Enabled Plugins (7개)

| Plugin | 출처 | 역할 |
|--------|------|------|
| codex@openai-codex | OpenAI | 코드 리뷰 및 분석 |
| superpowers@superpowers-marketplace | 커뮤니티 | 플랜/TDD 등 개발 워크플로우 |
| skill-creator@claude-plugins-official | Anthropic | 스킬 생성/수정 |
| find-skills | - | 스킬 검색 및 설치 |
| session-report@claude-plugins-official | Anthropic | 세션 보고서 |
| serena@claude-plugins-official | Anthropic | 코드 분석 및 수정 도구 |
| hookify@claude-plugins-official | Anthropic | Hook 설정 관리 |

### Skill Overrides (15개 - name-only 설정)

다음 `superpowers:` 스킬들은 **이름으로만 호출** 가능 (자동 트리거 안 함):

```
- code-reviewer
- requesting-code-review
- using-git-worktrees
- using-superpowers
- systematic-debugging
- dispatching-parallel-agents
- executing-plans
- test-driven-development
- subagent-driven-development
- brainstorming
- finishing-a-development-branch
- writing-plans
- writing-skills
- receiving-code-review
- verification-before-completion
```

### 기타 설정

- **Permissions**: `Bash(npm install:*)`
- **Effort Level**: `medium`
- **Status Line**: 커스텀 bash 스크립트 실행

### Known Marketplaces (3개)

```
- anthropic-agent-skills (GitHub: anthropics/skills)
- openai-codex (GitHub: openai/codex-plugin-cc)
- superpowers-marketplace (GitHub: obra/superpowers-marketplace)
```

---

## Project Scope 설정

**경로**: `.claude/settings.json`

### Enabled Plugins (2개)

| Plugin | 역할 |
|--------|------|
| context7@claude-plugins-official | 라이브러리 문서 조회 |
| claude-md-management@claude-plugins-official | CLAUDE.md 관리 |

### Disabled Plugins (3개)

다음 플러그인들은 프로젝트에서 **명시적으로 비활성화**됨:

```
✗ code-review@claude-plugins-official
✗ frontend-design@claude-plugins-official
✗ commit-commands@claude-plugins-official
```

> **주의**: User Scope에서는 활성화되어 있으나, 프로젝트에서는 사용하지 않음

### Enabled MCPs (1개)

```
✓ sequential-thinking
```

Extended thinking 기능 지원

---

## 설정 방법

### 1️⃣ User Scope 설정 (`~/.claude/settings.json`)

#### 방법 A: 직접 편집

```bash
# 파일 열기
nano ~/.claude/settings.json
```

#### 방법 B: Claude Code에서

```
/config
```

명령어로 GUI를 통해 설정할 수 있습니다.

#### 필요한 구성

```json
{
  "permissions": {
    "allow": ["Bash(npm install:*)"]
  },
  "skillOverrides": {
    "superpowers:code-reviewer": "name-only",
    "superpowers:requesting-code-review": "name-only",
    "superpowers:using-git-worktrees": "name-only",
    "superpowers:using-superpowers": "name-only",
    "superpowers:systematic-debugging": "name-only",
    "superpowers:dispatching-parallel-agents": "name-only",
    "superpowers:executing-plans": "name-only",
    "superpowers:test-driven-development": "name-only",
    "superpowers:subagent-driven-development": "name-only",
    "superpowers:brainstorming": "name-only",
    "superpowers:finishing-a-development-branch": "name-only",
    "superpowers:writing-plans": "name-only",
    "superpowers:writing-skills": "name-only",
    "superpowers:receiving-code-review": "name-only",
    "superpowers:verification-before-completion": "name-only"
  },
  "statusLine": {
    "type": "command",
    "command": "bash /Users/{YOUR_USERNAME}/.claude/statusline-command.sh"
  },
  "enabledPlugins": {
    "codex@openai-codex": true,
    "superpowers@superpowers-marketplace": true,
    "skill-creator@claude-plugins-official": true,
    "find-skills": true,
    "session-report@claude-plugins-official": true,
    "serena@claude-plugins-official": true,
    "hookify@claude-plugins-official": true
  },
  "extraKnownMarketplaces": {
    "anthropic-agent-skills": {
      "source": {
        "source": "github",
        "repo": "anthropics/skills"
      }
    },
    "openai-codex": {
      "source": {
        "source": "github",
        "repo": "openai/codex-plugin-cc"
      }
    },
    "superpowers-marketplace": {
      "source": {
        "source": "github",
        "repo": "obra/superpowers-marketplace"
      }
    }
  },
  "effortLevel": "medium"
}
```

> **⚠️ 주의**: `{YOUR_USERNAME}` 부분을 실제 사용자명으로 바꿔주세요.

### 2️⃣ Project Scope 설정 (`.claude/settings.json`)

#### 프로젝트 루트에서 파일 생성/수정

```bash
# 파일이 없으면 생성
touch .claude/settings.json
```

#### 필요한 구성

```json
{
    "enabledMcpjsonServers": ["sequential-thinking"],
    "enabledPlugins": {
        "context7@claude-plugins-official": true,
        "claude-md-management@claude-plugins-official": true,
        "code-review@claude-plugins-official": false,
        "frontend-design@claude-plugins-official": false,
        "commit-commands@claude-plugins-official": false
    }
}
```

---

## 설정 적용 순서

### 신규 팀원

1. **Claude Code 설치**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **User Scope 설정** (`~/.claude/settings.json`)
   - 위의 필요한 구성 내용을 파일에 복사
   - `{YOUR_USERNAME}` 부분을 실제 사용자명으로 변경

3. **프로젝트 클론**
   ```bash
   git clone <repository-url>
   cd csr-boilerplate
   ```

4. **Project Scope 설정** (`.claude/settings.json`)
   - 리포지토리의 `.claude/settings.json` 파일 확인
   - 필요한 경우 위의 구성으로 업데이트

5. **플러그인 설치** (필요시)
   ```
   /reload-plugins
   ```

6. **환경 확인**
   ```
   /skills
   /plugin
   ```

---

## 설정 파일 전문

### User Scope (`~/.claude/settings.json`)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm install:*)"
    ]
  },
  "skillOverrides": {
    "superpowers:code-reviewer": "name-only",
    "superpowers:requesting-code-review": "name-only",
    "superpowers:using-git-worktrees": "name-only",
    "superpowers:using-superpowers": "name-only",
    "superpowers:systematic-debugging": "name-only",
    "superpowers:dispatching-parallel-agents": "name-only",
    "superpowers:executing-plans": "name-only",
    "superpowers:test-driven-development": "name-only",
    "superpowers:subagent-driven-development": "name-only",
    "superpowers:brainstorming": "name-only",
    "superpowers:finishing-a-development-branch": "name-only",
    "superpowers:writing-plans": "name-only",
    "superpowers:writing-skills": "name-only",
    "superpowers:receiving-code-review": "name-only",
    "superpowers:verification-before-completion": "name-only"
  },
  "statusLine": {
    "type": "command",
    "command": "bash /Users/{YOUR_USERNAME}/.claude/statusline-command.sh"
  },
  "enabledPlugins": {
    "codex@openai-codex": true,
    "superpowers@superpowers-marketplace": true,
    "skill-creator@claude-plugins-official": true,
    "find-skills": true,
    "session-report@claude-plugins-official": true,
    "serena@claude-plugins-official": true,
    "hookify@claude-plugins-official": true
  },
  "extraKnownMarketplaces": {
    "anthropic-agent-skills": {
      "source": {
        "source": "github",
        "repo": "anthropics/skills"
      }
    },
    "openai-codex": {
      "source": {
        "source": "github",
        "repo": "openai/codex-plugin-cc"
      }
    },
    "superpowers-marketplace": {
      "source": {
        "source": "github",
        "repo": "obra/superpowers-marketplace"
      }
    }
  },
  "effortLevel": "medium"
}
```

### Project Scope (`.claude/settings.json`)

```json
{
    "enabledMcpjsonServers": ["sequential-thinking"],
    "enabledPlugins": {
        "context7@claude-plugins-official": true,
        "claude-md-management@claude-plugins-official": true,
        "code-review@claude-plugins-official": false,
        "frontend-design@claude-plugins-official": false,
        "commit-commands@claude-plugins-official": false
    }
}
```

---

## 주요 설정 항목 설명

### Skill Overrides: "name-only"

- **의미**: 스킬을 명시적으로 호출할 때만 작동
- **목적**: 불필요한 자동 트리거 방지
- **사용**: `/Skill` 명령어로 호출

### MCPs (Model Context Protocols)

- **sequential-thinking**: 복잡한 문제 해결을 위한 단계별 사고 프로세스
- 다른 MCP가 필요한 경우 `enabledMcpjsonServers` 배열에 추가

### Plugin Disable 전략

프로젝트에서 일부 플러그인을 비활성화하는 이유:

1. **code-review**: User Scope에서만 사용 (필요시 명시적 호출)
2. **frontend-design**: 프로젝트 특성상 필요 없음
3. **commit-commands**: 다른 도구로 대체

---

## 🔍 검증 체크리스트

설정 완료 후 다음을 확인하세요:

- [ ] `~/.claude/settings.json` 파일 존재 확인
- [ ] `.claude/settings.json` 파일 존재 확인
- [ ] Claude Code에서 `/skills` 명령어 실행 가능
- [ ] `/plugin` 명령어로 플러그인 상태 확인
- [ ] 프로젝트에서 context7 플러그인 정상 작동 확인

---

## ⚠️ 주의사항

1. **User Scope 설정**
   - 홈 디렉토리(`~/.claude/`)에 위치
   - 모든 프로젝트에 영향
   - 경로(statusLine command)에 사용자명 포함 시 주의

2. **Project Scope 설정**
   - `.claude/` 디렉토리에 위치 (프로젝트 루트)
   - 해당 프로젝트에만 영향
   - User Scope 설정을 **오버라이드**함

3. **플러그인 설치**
   - 인터넷 연결 필요
   - 마켓플레이스가 접근 가능해야 함

4. **환경 변수**
   - 일부 기능은 환경 변수 필요 가능
   - 프로젝트의 `.env.dev`, `.env.prod` 파일 확인

---

## 📞 문제 해결

### 플러그인이 로드되지 않음

```bash
# Claude Code 재시작
/reload-plugins
```

### 설정 파일 형식 오류

JSON 파일 유효성 검증:

```bash
# macOS/Linux
jq . ~/.claude/settings.json
jq . .claude/settings.json

# 또는
python3 -m json.tool ~/.claude/settings.json
```

### 스킬을 찾을 수 없음

- `/find-skills` 명령어로 스킬 검색
- `extraKnownMarketplaces` 설정 확인
- 인터넷 연결 확인

---

## 🔄 버전 관리

- **마지막 업데이트**: 2026-05-08
- **Serena 플러그인 버전**: N/A (자동 업데이트)
- **Context7 버전**: N/A (자동 업데이트)

이 문서는 환경 설정이 변경될 때마다 업데이트해야 합니다.

---

## 📎 관련 파일

- `CLAUDE.md` - 프로젝트 개발 가이드
- `.claude/rules/INDEX.md` - 코드 규칙 인덱스
- `docs/spec/architecture.md` - 아키텍처 문서
