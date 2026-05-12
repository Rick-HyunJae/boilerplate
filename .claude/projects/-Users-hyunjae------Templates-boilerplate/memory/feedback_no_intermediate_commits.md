---
name: 중간 커밋 없이 작업 진행
description: subagent-driven-development 실행 중 태스크별 커밋 대신 작업 완료 후 한 번에 커밋 선호
type: feedback
---

작업 중 태스크마다 git add/commit하지 않는다. 모든 작업이 끝난 후 사용자가 직접 또는 한 번에 커밋을 진행한다.

**Why:** 사용자가 중간 커밋을 원하지 않음 — 전체 작업 완료 후 일괄 커밋 선호.

**How to apply:** subagent-driven-development 실행 시 각 태스크의 커밋 스텝을 건너뜀. 파일 변경만 수행하고 커밋은 하지 않음. 작업 완료 후 커밋 여부를 사용자에게 확인.
