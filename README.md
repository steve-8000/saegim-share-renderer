# saegim-share-renderer

Saegim(새김) 공유 카드 OG 이미지 렌더러 — Satori(HTML/CSS→SVG) + resvg(SVG→PNG),
Bun 런타임. `clab-cluster`에 ArgoCD GitOps로 배포된다.

## 동작

- `GET /s/:id` — 공유 페이지(HTML, `og:image` 메타태그 포함).
- `GET /s/:id/card.png` — PocketBase `shares` 컬렉션에서 레코드를 조회해
  1200×630 OG 카드 PNG를 렌더링. `Cache-Control: immutable`로 응답(콘텐츠 해시
  없이 id 자체가 불변 캐시 키 — 레코드는 생성 후 수정되지 않음).
- `GET /healthz` — liveness/readiness.

카드에는 `shareAlias`만 표시되고 실명은 애초에 스키마에 없음(02 §5/§8 정책).

## 배포

- 이미지: `ghcr.io/steve-8000/saegim-share-renderer:latest` (private GHCR
  패키지 — `imagePullSecrets: ghcr-pull-secret`로 pull, 클러스터에 직접 생성됨).
- PocketBase는 내부 ClusterIP(`pocketbase.saegim.svc.cluster.local:8090`)로
  조회 — 공개 인그레스를 거치지 않음(00 §5.1).
- `deploy/k8s/`: Deployment(replicas=1, stateless) + Service + Ingress
  (`share.saegim.clab.one`).

## 로컬 실행

```
bun install
bun run src/server.ts
```
