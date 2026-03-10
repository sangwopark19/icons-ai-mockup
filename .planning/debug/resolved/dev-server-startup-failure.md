---
status: resolved
trigger: "개발서버(dev server)가 실행되지 않는 문제. 원인을 분석하고 해결해야 함."
created: 2026-03-10T00:00:00Z
updated: 2026-03-10T00:10:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: 해결 완료
test: pnpm dev 재실행으로 검증
expecting: 정상 시작 확인됨
next_action: 완료

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: `pnpm dev` 실행 시 개발서버(web: Next.js, api: Fastify)가 정상 시작되어야 함
actual: 개발서버 실행 불가 - `@mockup-ai/web:dev` 실패로 turbo 전체 실패
errors: |
  Error: Cannot find module '/Users/sangwopark19/icons/icons-ai-mockup/apps/web/node_modules/next/dist/bin/next'
  code: 'MODULE_NOT_FOUND'
  @mockup-ai/web:dev: ELIFECYCLE Command failed with exit code 1
reproduction: pnpm dev 실행
started: 최근 발생

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: turbo.json 설정 오류
  evidence: turbo.json 구조 정상 - dev task가 cache:false, persistent:true로 올바르게 설정됨
  timestamp: 2026-03-10T00:03:00Z

- hypothesis: apps/web/node_modules 자체가 없음
  evidence: apps/web/node_modules 디렉토리는 존재하고 next 심볼릭 링크도 있음
  timestamp: 2026-03-10T00:04:00Z

- hypothesis: pnpm workspace 설정 오류
  evidence: pnpm-workspace.yaml이 apps/*, packages/* 올바르게 설정됨
  timestamp: 2026-03-10T00:05:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-10T00:02:00Z
  checked: pnpm dev 실행 출력
  found: |
    Error: Cannot find module '.../apps/web/node_modules/next/dist/bin/next'
    @mockup-ai/api:dev도 exit code 2로 실패
  implication: next 패키지의 dist/bin/next 파일이 없음

- timestamp: 2026-03-10T00:03:00Z
  checked: apps/web/node_modules/next 심볼릭 링크 대상
  found: |
    symlink -> ../../../node_modules/.pnpm/next@16.1.1_.../node_modules/next
    그런데 해당 경로에 실제 next 패키지가 없음
  implication: pnpm 가상 스토어(node_modules/.pnpm/)에 next 패키지 디렉토리 자체가 누락됨

- timestamp: 2026-03-10T00:04:00Z
  checked: node_modules/.pnpm/ 디렉토리 내 next 관련 패키지
  found: |
    @next+env@16.1.1 만 있음
    next@16.1.1_... 디렉토리가 없음
    즉, next 패키지 자체가 pnpm 가상 스토어에 설치되지 않은 상태
  implication: pnpm install이 불완전하게 실행되었거나 next 패키지 다운로드/링크가 실패했음

- timestamp: 2026-03-10T00:06:00Z
  checked: pnpm install 실행 후 결과
  found: |
    Packages: +3 -30 변경됨
    next@16.1.1_react-dom@19.2.3_react@19.2.3__react@19.2.3 디렉토리가 생성됨
  implication: pnpm install이 누락된 패키지를 복원함

- timestamp: 2026-03-10T00:08:00Z
  checked: pnpm dev 재실행 결과
  found: |
    @mockup-ai/web:dev: ▲ Next.js 16.1.1 (Turbopack)
    @mockup-ai/web:dev: - Local: http://localhost:3000
    @mockup-ai/web:dev: ✓ Ready in 484ms
    @mockup-ai/api:dev: ✅ 작업 큐 초기화 완료 (단, DB/Redis 연결은 외부 서비스 필요)
  implication: 개발서버 정상 시작 확인

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  pnpm 가상 스토어(node_modules/.pnpm/)에서 next@16.1.1 패키지 디렉토리가 누락되어 있었음.
  apps/web/node_modules/next는 심볼릭 링크로 pnpm 가상 스토어의 next를 가리키고 있는데,
  그 대상 경로에 실제 패키지 파일이 없었음.
  원인: pnpm install이 중간에 실패했거나, 누군가 node_modules/.pnpm에서 파일을 삭제했거나,
  lockfile과 실제 설치된 상태가 불일치한 상황.

fix: |
  pnpm install 실행으로 누락된 next@16.1.1 패키지를 재설치함.
  Packages: +3 -30 변경 (next, @next/env, @next/swc-darwin-arm64 재설치)

verification: |
  pnpm dev 재실행 후:
  - @mockup-ai/web:dev: Next.js 16.1.1 (Turbopack) - Local: http://localhost:3000 - Ready in 484ms
  - @mockup-ai/api:dev: 서버 시작 성공 (DB/Redis는 외부 서비스로 별도 구동 필요)
  개발서버 정상 시작 확인됨.

files_changed: []
