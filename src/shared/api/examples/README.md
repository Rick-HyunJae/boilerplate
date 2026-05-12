# API Controller Examples

| File | Controller | 용도 |
|------|-----------|------|
| axios-gw.example.ts | axios `gw` | 인증 GW 통신 |
| axios-objectStorage.example.ts | axios `objectStorage` | S3 Object Storage |
| axios-uncert.example.ts | axios `uncert` | 비인증 GW |
| axios-dw.example.ts | axios `dw` | DW Open API |
| fetch-gw.example.ts | fetch `gw` | stream/AbortController 활용 시 |
| eventSource.example.ts | EventSource | SSE 수신 |

각 example은 `interceptors.use`까지 등록된 살아있는 인스턴스를 export한다. 서비스에서 사용 시 복사·수정해서 features 레이어로 옮긴다.
