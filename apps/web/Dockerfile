# Next.js 프론트엔드 Dockerfile (모노레포 루트에서 빌드)
FROM node:22-alpine AS base

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# 루트 의존성 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# 빌드 단계
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# 소스 복사
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY turbo.json ./

# 빌드 시 API URL을 ARG로 받음 (NEXT_PUBLIC_* 변수는 빌드 타임에 번들에 포함됨)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 환경 변수 설정
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# shared 빌드 후 web 빌드
WORKDIR /app/packages/shared
RUN pnpm build || true

# 루트에서 빌드 실행 (Turbopack이 올바른 루트를 찾을 수 있도록)
WORKDIR /app
RUN cd apps/web && pnpm build

# 프로덕션 실행 단계
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 시스템 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# public 폴더 복사 (있는 경우)
COPY --from=builder /app/apps/web/public ./public

# 빌드 결과물 복사
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
