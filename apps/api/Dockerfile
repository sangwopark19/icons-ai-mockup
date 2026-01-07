# Fastify API 서버 Dockerfile
FROM node:22-alpine AS base

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# Sharp 빌드를 위한 의존성
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 빌드 단계
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 클라이언트 생성
RUN pnpm db:generate

# TypeScript 빌드
RUN pnpm build

# 프로덕션 실행 단계
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Sharp 런타임 의존성
RUN apk add --no-cache vips

# 시스템 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# 빌드 결과물 복사
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/prisma ./prisma

# 데이터 디렉토리 생성
RUN mkdir -p /app/data && chown -R fastify:nodejs /app/data

USER fastify

EXPOSE 4000

CMD ["node", "dist/server.js"]
