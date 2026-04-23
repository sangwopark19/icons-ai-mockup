# 🚀 MockupAI 빠른 시작 가이드

> 관리자/설치 담당자를 위한 설치 및 설정 가이드

---

## 📋 사전 준비

### 필수 요구사항

| 항목 | 최소 사양 | 권장 사양 |
|------|----------|----------|
| Docker | 20.x 이상 | 최신 버전 |
| Docker Compose | 2.x 이상 | 최신 버전 |
| RAM | 4GB | 8GB 이상 |
| 저장 공간 | 5GB | 20GB 이상 |
| 포트 | 3000, 4000 | - |

### 필수 API 키

- **Gemini API Key**: Google AI Studio에서 발급
  - https://makersuite.google.com/app/apikey

---

## ⚡ 5분 설치

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# 필수 설정
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# 선택 설정 (기본값 사용 가능)
NEXT_PUBLIC_API_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000
```

### 2. 서비스 시작

```bash
# 전체 스택 빌드 및 시작
docker compose up -d --build
```

### 3. 확인

```bash
# 서비스 상태 확인
docker compose ps

# 예상 출력:
# NAME              STATUS              PORTS
# mockup-postgres   Up (healthy)        5432
# mockup-redis      Up (healthy)        6379
# mockup-api        Up (healthy)        4000
# mockup-worker     Up                  
# mockup-web        Up                  3000
```

### 4. 접속

- **웹 앱**: http://localhost:3000
- **API 헬스체크**: http://localhost:4000/health

---

## 🖥️ 사내 네트워크 배포

회사 내부망에서 여러 사용자가 접속할 경우:

### 1. 서버 IP 확인

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# 또는
ip addr
```

예: 서버 IP가 `192.168.1.100`인 경우

### 2. 환경 변수 수정

```bash
# .env 파일
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# 서버 IP로 변경
NEXT_PUBLIC_API_URL=http://192.168.1.100:4000
CORS_ORIGIN=http://192.168.1.100:3000,http://localhost:3000
```

### 3. 재시작

```bash
docker compose down
docker compose up -d --build
```

### 4. 사용자 안내

사용자들에게 다음 주소로 접속하도록 안내:
```
http://192.168.1.100:3000
```

---

## 🔧 환경 변수 상세

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API 키 |
| `JWT_SECRET` | ✅ | 개발용 | JWT 토큰 서명 키 (32자 이상) |
| `NEXT_PUBLIC_API_URL` | ❌ | `http://172.30.1.42:4000` | 프론트엔드에서 접근할 API URL |
| `CORS_ORIGIN` | ❌ | `http://localhost:3000` | 허용할 프론트엔드 Origin (쉼표 구분) |
| `DATABASE_URL` | ❌ | Docker 내부 | PostgreSQL 연결 URL |
| `REDIS_URL` | ❌ | Docker 내부 | Redis 연결 URL |

---

## 📊 서비스 구성

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│  │   web       │   │    api      │   │   worker    │   │
│  │  (Next.js)  │──▶│  (Fastify)  │◀──│  (BullMQ)   │   │
│  │   :3000     │   │    :4000    │   │             │   │
│  └─────────────┘   └──────┬──────┘   └──────┬──────┘   │
│                           │                  │          │
│           ┌───────────────┴───────────────┬──┘          │
│           ▼                               ▼             │
│  ┌─────────────┐                 ┌─────────────┐       │
│  │  postgres   │                 │    redis    │       │
│  │ (PostgreSQL)│                 │   (Cache)   │       │
│  │    :5432    │                 │    :6379    │       │
│  └─────────────┘                 └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

| 서비스 | 역할 | 포트 |
|--------|------|------|
| **web** | 사용자 인터페이스 (Next.js) | 3000 |
| **api** | REST API 서버 (Fastify) | 4000 |
| **worker** | 이미지 생성 작업 처리 | - |
| **postgres** | 데이터베이스 | 5432 |
| **redis** | 캐시 및 작업 큐 | 6379 |

---

## 🔍 로그 확인

```bash
# 전체 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f web
docker compose logs -f api
docker compose logs -f worker

# 최근 100줄만
docker compose logs --tail=100 api
```

---

## 🔄 운영 명령어

### 서비스 제어

```bash
# 시작
docker compose up -d

# 중지
docker compose stop

# 재시작
docker compose restart

# 완전 종료 (컨테이너 삭제)
docker compose down

# 데이터 포함 완전 삭제 (주의!)
docker compose down -v
```

### 업데이트

```bash
# 1. 코드 업데이트
git pull

# 2. 재빌드 및 재시작
docker compose up -d --build
```

### 데이터 백업

```bash
# 데이터베이스 백업
docker compose exec postgres pg_dump -U user mockup > backup_$(date +%Y%m%d).sql

# 업로드된 이미지 백업
docker cp mockup-api:/app/data ./data_backup
```

### 데이터 복원

```bash
# 데이터베이스 복원
cat backup_20260126.sql | docker compose exec -T postgres psql -U user mockup

# 이미지 복원
docker cp ./data_backup/. mockup-api:/app/data/
```

---

## 🚨 문제 해결

### 서비스가 시작되지 않음

```bash
# 상태 확인
docker compose ps

# 로그 확인
docker compose logs api
docker compose logs worker

# 재시작 시도
docker compose restart
```

### 포트 충돌

다른 프로그램이 포트를 사용 중인 경우:

```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr :3000

# 포트 사용 확인 (Mac/Linux)
lsof -i :3000
```

`docker-compose.yml`에서 포트 변경:
```yaml
web:
  ports:
    - "3001:3000"  # 외부:내부
```

### 이미지 생성 실패

1. **Gemini API 키 확인**
```bash
docker compose logs worker | grep -i "error\|gemini"
```

2. **워커 재시작**
```bash
docker compose restart worker
```

### 데이터베이스 연결 실패

```bash
# DB 상태 확인
docker compose exec postgres pg_isready

# DB 로그 확인
docker compose logs postgres
```

### 메모리 부족

Docker Desktop 설정에서 메모리 할당 증가:
- Docker Desktop → Settings → Resources → Memory: 8GB 이상

---

## 📈 성능 최적화

### 동시 작업 수 조정

`docker-compose.yml`의 worker 설정에서:
```yaml
worker:
  environment:
    - WORKER_CONCURRENCY=4  # 동시 처리 작업 수
```

### 이미지 캐시 정리

```bash
# 사용하지 않는 Docker 이미지 정리
docker system prune -a
```

---

## 📞 지원

문제 발생 시 수집해야 할 정보:

1. **Docker 로그**
```bash
docker compose logs > logs_$(date +%Y%m%d).txt
```

2. **서비스 상태**
```bash
docker compose ps
```

3. **시스템 정보**
```bash
docker version
docker compose version
```

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Docker Desktop 설치 및 실행 중
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] 포트 3000, 4000 사용 가능
- [ ] 최소 4GB RAM 여유
- [ ] `docker compose up -d --build` 실행
- [ ] http://localhost:3000 접속 확인
- [ ] 회원가입/로그인 테스트
- [ ] 이미지 생성 테스트
