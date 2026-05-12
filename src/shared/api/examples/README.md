# API Controller Examples

| File | Controller | 용도 |
|------|-----------|------|
| axios-default.example.ts | axios `default` | 인증 API 통신 |
| fetch-default.example.ts | fetch `default` | stream/AbortController 활용 시 |
| eventSource.example.ts | EventSource | SSE 수신 |

각 example은 `interceptors.use`까지 등록된 인스턴스를 export한다. 서비스에서 사용 시 복사·수정해서 features 레이어로 옮긴다.
