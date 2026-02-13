#!/bin/bash
set -e  # 에러 발생 시 중단

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Step 2-5: 서버에서 마이그레이션 재생성${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 프로젝트 루트 확인
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}❌ 에러: docker-compose.yml을 찾을 수 없습니다.${NC}"
  echo -e "${RED}프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
  exit 1
fi

echo -e "${YELLOW}현재 디렉토리: $(pwd)${NC}"
echo ""

# Step 2: Pull 및 마이그레이션 재생성
echo -e "${GREEN}[Step 2] Git pull 및 마이그레이션 재생성${NC}"
echo "----------------------------------------"

echo "▶ Git pull..."
git pull origin v3

echo ""
echo "▶ PostgreSQL 시작 및 헬스 체크..."
docker compose up -d postgres
sleep 3
docker compose exec postgres pg_isready -U user -d mockup

echo ""
echo "▶ Prisma 마이그레이션 재생성 (Docker 내부, 볼륨 마운트)..."
docker compose run --rm \
  -v "$(pwd)/apps/api/prisma:/app/apps/api/prisma" \
  -e DATABASE_URL="postgresql://user:password@postgres:5432/mockup?schema=public" \
  migrate \
  sh -c "cd /app/apps/api && npx prisma migrate dev --name add_user_role_and_active --create-only"

echo ""
echo "▶ 생성된 마이그레이션 확인..."
MIGRATION_FILE=$(ls apps/api/prisma/migrations/*_add_user_role_and_active/migration.sql 2>/dev/null | head -1)

if [ -z "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ 에러: 마이그레이션 파일이 생성되지 않았습니다.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 마이그레이션 파일 생성: $MIGRATION_FILE${NC}"
echo ""
echo "생성된 SQL 미리보기:"
echo "----------------------------------------"
head -20 "$MIGRATION_FILE"
echo "----------------------------------------"
echo ""

# Step 3: 검증 (중요한 부분만)
echo -e "${GREEN}[Step 3] 생성된 SQL 검증${NC}"
echo "----------------------------------------"

ERRORS=0

# snake_case 사용 확인
if grep -q '"users"' "$MIGRATION_FILE"; then
  echo -e "${GREEN}✅ 테이블명: \"users\" (올바름)${NC}"
else
  echo -e "${RED}❌ 테이블명: \"users\" 없음 (확인 필요)${NC}"
  ERRORS=$((ERRORS + 1))
fi

if grep -q '"user_role"' "$MIGRATION_FILE"; then
  echo -e "${GREEN}✅ Enum명: \"user_role\" (올바름)${NC}"
else
  echo -e "${RED}❌ Enum명: \"user_role\" 없음 (확인 필요)${NC}"
  ERRORS=$((ERRORS + 1))
fi

if grep -q '"is_active"' "$MIGRATION_FILE"; then
  echo -e "${GREEN}✅ 컬럼명: \"is_active\" (올바름)${NC}"
else
  echo -e "${RED}❌ 컬럼명: \"is_active\" 없음 (확인 필요)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 누락된 스키마 확인
if grep -q '"deleted_at"' "$MIGRATION_FILE"; then
  echo -e "${GREEN}✅ deleted_at 컬럼 포함${NC}"
else
  echo -e "${RED}❌ deleted_at 컬럼 누락${NC}"
  ERRORS=$((ERRORS + 1))
fi

if grep -q 'CREATE TABLE "admin_audit_logs"' "$MIGRATION_FILE"; then
  echo -e "${GREEN}✅ admin_audit_logs 테이블 포함${NC}"
else
  echo -e "${RED}❌ admin_audit_logs 테이블 누락${NC}"
  ERRORS=$((ERRORS + 1))
fi

# PascalCase 사용 여부 (있으면 안 됨)
if grep -q '"User"' "$MIGRATION_FILE" || grep -q '"UserRole"' "$MIGRATION_FILE" || grep -q '"isActive"' "$MIGRATION_FILE"; then
  echo -e "${RED}❌ PascalCase 발견 (수정 필요)${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ PascalCase 없음 (올바름)${NC}"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}⚠️  검증 실패: $ERRORS개 오류 발견${NC}"
  echo -e "${RED}마이그레이션 파일을 확인하고 수동으로 수정하거나${NC}"
  echo -e "${RED}다시 생성해주세요.${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo "전체 마이그레이션 파일 내용:"
  cat "$MIGRATION_FILE"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Step 2-3 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "다음 단계:"
echo "1. 생성된 마이그레이션 파일을 Git commit & push:"
echo "   git add apps/api/prisma/migrations/"
echo "   git commit -m \"fix: Prisma 마이그레이션 재생성 (올바른 네이밍 + 누락 스키마)\""
echo "   git push origin v3"
echo ""
echo "2. Docker 스택 재빌드 및 검증:"
echo "   docker compose down"
echo "   docker compose up -d --build"
echo ""
echo "3. 검증:"
echo "   docker compose logs migrate"
echo "   docker compose ps"
echo "   curl http://localhost:4000/health"
echo ""
echo "또는 아래 명령어로 자동 실행:"
echo "   bash .omc/autopilot/server-final-steps.sh"
