#!/bin/bash
set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Step 4-5: Git Commit & Docker 재빌드${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 4: Git commit & push
echo -e "${GREEN}[Step 4] Git commit & push${NC}"
echo "----------------------------------------"

git add apps/api/prisma/migrations/
git -c user.name="sangwopark19" -c user.email="sangwopark19@gmail.com" \
  commit -m "fix: Prisma 마이그레이션 재생성 (올바른 네이밍 + 누락 스키마)"
git push origin v3

echo -e "${GREEN}✅ Git push 완료${NC}"
echo ""

# Step 5: Docker 재빌드
echo -e "${GREEN}[Step 5] Docker 스택 재빌드${NC}"
echo "----------------------------------------"

echo "▶ 기존 컨테이너 중지..."
docker compose down

echo ""
echo "▶ 전체 스택 재빌드 및 시작..."
docker compose up -d --build

echo ""
echo "▶ 컨테이너 상태 확인 (30초 대기)..."
sleep 30

echo ""
docker compose ps

echo ""
echo -e "${GREEN}[검증] 마이그레이션 로그${NC}"
echo "----------------------------------------"
docker compose logs migrate

echo ""
echo -e "${GREEN}[검증] API 헬스 체크${NC}"
echo "----------------------------------------"
HEALTH_STATUS=$(curl -s http://localhost:4000/health || echo "FAILED")
if [[ "$HEALTH_STATUS" == *"ok"* ]] || [[ "$HEALTH_STATUS" == *"healthy"* ]]; then
  echo -e "${GREEN}✅ API 서버 정상: $HEALTH_STATUS${NC}"
else
  echo -e "${RED}❌ API 서버 응답 없음 또는 오류${NC}"
  echo "응답: $HEALTH_STATUS"
  echo ""
  echo "API 로그 확인:"
  docker compose logs api --tail=50
  exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 모든 단계 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "최종 검증:"
echo "1. 모든 컨테이너가 Up 상태인지 확인"
echo "2. migrate 컨테이너가 Exited (0) 상태인지 확인"
echo "3. API /health 엔드포인트 정상 응답"
echo ""
echo "추가 검증 (선택):"
echo "  docker compose exec postgres psql -U user -d mockup -c '\\d users'"
echo "  docker compose exec postgres psql -U user -d mockup -c '\\dT+ user_role'"
echo "  docker compose exec postgres psql -U user -d mockup -c '\\d admin_audit_logs'"
