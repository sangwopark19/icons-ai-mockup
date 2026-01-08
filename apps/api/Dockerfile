# Fastify API 서버 Dockerfile (모노레포 루트에서 빌드)
FROM node:22-alpine AS base

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# Sharp 빌드를 위한 의존성
RUN apk add --no-cache python3 make g++ vips-dev

# 루트 의존성 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# 빌드 단계
FROM base AS builder
WORKDIR /app

# Sharp 빌드 의존성 + wget for healthcheck
RUN apk add --no-cache python3 make g++ vips-dev vips wget

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# 소스 복사
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# shared 빌드
WORKDIR /app/packages/shared
RUN pnpm build || true

# Prisma 클라이언트 생성 및 빌드
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm build

# 마이그레이션 실행 단계
FROM builder AS migrate
WORKDIR /app/apps/api
CMD ["npx", "prisma", "migrate", "deploy"]

# 프로덕션 실행 단계 - builder를 그대로 사용
FROM builder AS runner
WORKDIR /app/apps/api

ENV NODE_ENV=production

# 시스템 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# 데이터 디렉토리 생성
RUN mkdir -p /app/data && chown -R fastify:nodejs /app/data

USER fastify

EXPOSE 4000

CMD ["node", "dist/server.js"]
