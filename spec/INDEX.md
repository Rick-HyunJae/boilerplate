# Spec Index

프로젝트의 **사실(facts)** 을 기술하는 문서 모음. "무엇이 어떻게 되어 있는가"를 설명하며, 코드와 항상 동기화되어야 합니다.

> Rule 과의 분리 원칙: 이 디렉토리는 사실을 기술하고, 규약/제약은 `.claude/rules/` 에 둡니다.
> Rule 은 spec 을 참조(link)하되, 사실을 중복 기재하지 않습니다.

## 목차

| 파일                                                                           | 한 줄 요약                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [architecture/bundle-and-execution.md](./architecture/bundle-and-execution.md) | Vite 번들 설정 및 앱 실행 흐름                          |
| [architecture/overview.md](./architecture/overview.md)                         | FSD 레이어 구조 전체 조감도                             |
| [architecture/fsd-layers.md](./architecture/fsd-layers.md)                     | 각 레이어의 책임, 슬라이스/세그먼트 규칙                |
| [architecture/routing.md](./architecture/routing.md)                           | react-router 라우팅 구조                                |
| [architecture/providers.md](./architecture/providers.md)                       | 전역 Provider 구성 (QueryClient 등)                     |
| [api/client.md](./api/client.md)                                               | axios 인스턴스 설정, 인터셉터, 에러 처리                |
| [env/config.md](./env/config.md)                                               | 환경변수 스키마, ENV 객체, 빌드 모드                    |
| [testing/strategy.md](./testing/strategy.md)                                   | 테스트 전략, 커버리지 기준, 유틸리티                    |
| [styles/system.md](./styles/system.md)                                         | 스타일 시스템 구성 (Tailwind v4 / SCSS), PostCSS 설정   |
| [styles/component-patterns.md](./styles/component-patterns.md)                 | FSD 컴포넌트 스타일 적용 패턴 (CSS Modules vs Tailwind) |
