# 서버 배포 가이드

MockupAI 프로젝트를 서버에서 GitHub clone 받고 Docker Compose로 한 번에 실행하는 방법을 안내합니다.

## 목차

- [사전 요구사항](#사전-요구사항)
- [배포 프로세스](#배포-프로세스)
  - [1단계: 사전 요구사항 확인](#1단계-사전-요구사항-확인)
  - [2단계: 프로젝트 Clone](#2단계-프로젝트-clone)
  - [3단계: 환경 변수 설정](#3단계-환경-변수-설정)
  - [4단계: Docker Compose로 실행](#4단계-docker-compose로-실행)
  - [5단계: 실행 상태 확인](#5단계-실행-상태-확인)
  - [6단계: 접속 확인](#6단계-접속-확인)
  - [7단계: 종료 및 재시작](#7단계-종료-및-재시작)
- [문제 해결](#문제-해결)
- [배포 체크리스트](#배포-체크리스트)

---

## 사전 요구사항

서버 배포를 위해 다음 소프트웨어가 필요합니다:

- **Docker** 20.10 이상
- **Docker Compose** 2.0 이상
- **Git** 2.0 이상
- **Linux 서버** (Ubuntu 20.04+ 권장)

---

## 배포 프로세스

### 1단계: 사전 요구사항 확인

서버에 필요한 소프트웨어가 설치되어 있는지 확인합니다.

```bash
# Docker 설치 확인
docker --version

# Docker Compose 설치 확인
docker-compose --version

# Git 설치 확인
git --version
```

#### 설치되지 않은 경우

Ubuntu/Debian 기준으로 필요한 패키지를 설치합니다:

```bash
# 패키지 목록 업데이트
sudo apt update

# Docker, Docker Compose, Git 설치
sudo apt install -y docker.io docker-compose git

# Docker 서비스 시작 및 부팅 시 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (재로그인 필요)
sudo usermod -aG docker $USER
```

**⚠️ 주의:** `usermod` 명령 후 로그아웃 후 다시 로그인해야 권한이 적용됩니다.

---

### 2단계: 프로젝트 Clone

GitHub 저장소에서 프로젝트를 clone합니다.

```bash
# 프로젝트를 clone할 디렉토리로 이동
cd /home/your-username

# GitHub에서 clone (실제 저장소 URL로 변경 필요)
git clone https://github.com/your-org/icons-ai-mockup.git

# 프로젝트 디렉토리로 이동
cd icons-ai-mockup
```

**📝 참고:** 저장소가 private인 경우 SSH 키 설정이나 Personal Access Token이 필요합니다.

---

### 3단계: 환경 변수 설정

프로젝트 실행에 필요한 환경 변수를 설정합니다.

#### .env 파일 생성

```bash
# .env 파일 생성
touch .env

# .env 파일 편집
nano .env
```

#### 필수 환경 변수 설정

다음 내용을 `.env` 파일에 추가합니다. **서버 환경에 맞게 수정이 필요합니다.**

```env
# ===================
# Gemini API (필수)
# ===================
GEMINI_API_KEY="your-actual-gemini-api-key"

# ===================
# JWT 인증 (필수)
# ===================
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_ACCESS_EXPIRY="60m"
JWT_REFRESH_EXPIRY="7d"

# ===================
# 서버 IP 설정 (필수 - 서버 실제 IP로 변경)
# ===================
# 예: http://192.168.1.100:4000 또는 http://your-domain.com:4000
NEXT_PUBLIC_API_URL="http://YOUR_SERVER_IP:4000"

# ===================
# CORS 설정 (필수 - 접속할 클라이언트 IP/도메인 추가)
# ===================
CORS_ORIGIN="http://YOUR_SERVER_IP:3000,http://localhost:3000"

# ===================
# 데이터베이스 (기본값 사용 가능)
# ===================
DATABASE_URL="postgresql://user:password@localhost:5432/mockup?schema=public"

# ===================
# Redis (기본값 사용 가능)
# ===================
REDIS_URL="redis://localhost:6379"

# ===================
# 서버 설정 (선택)
# ===================
NODE_ENV="production"
API_PORT=4000
WEB_PORT=3000

# ===================
# 파일 업로드 (선택)
# ===================
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./data"
```

#### 서버 IP 확인 방법

```bash
# 내부 IP 확인
ip addr show

# 공인 IP 확인
curl ifconfig.me
```

#### 환경 변수 설명

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `GEMINI_API_KEY` | Google Gemini API 키 ([발급 링크](https://makersuite.google.com/app/apikey)) | ✅ 필수 |
| `JWT_SECRET` | JWT 토큰 서명용 시크릿 키 (랜덤 문자열) | ✅ 필수 |
| `NEXT_PUBLIC_API_URL` | 프론트엔드가 사용할 API 서버 URL | ✅ 필수 |
| `CORS_ORIGIN` | CORS 허용 origin (쉼표로 구분) | ✅ 필수 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | 선택 (기본값 사용 가능) |
| `REDIS_URL` | Redis 연결 문자열 | 선택 (기본값 사용 가능) |

---

### 4단계: Docker Compose로 실행

모든 서비스를 Docker Compose로 빌드하고 실행합니다.

```bash
# 모든 서비스 빌드 및 백그라운드 실행 (처음 실행 시)
docker-compose up -d --build

# 또는 빌드 없이 실행 (이미 빌드된 경우)
docker-compose up -d
```

#### 실행되는 서비스

Docker Compose는 다음 6개의 서비스를 실행합니다:

| 서비스명 | 설명 | 포트 | 비고 |
|---------|------|------|------|
| `postgres` | PostgreSQL 데이터베이스 | 5432 | 영구 볼륨 사용 |
| `redis` | Redis 캐시 및 작업 큐 | 6379 | 영구 볼륨 사용 |
| `migrate` | Prisma DB 마이그레이션 | - | 한 번만 실행 후 종료 |
| `api` | Fastify API 서버 | 4000 | 웹 API 제공 |
| `worker` | BullMQ 백그라운드 워커 | - | AI 작업 처리 |
| `web` | Next.js 프론트엔드 | 3000 | 사용자 인터페이스 |

#### 빌드 시간

- 처음 빌드 시 **10~15분** 정도 소요될 수 있습니다.
- 네트워크 속도와 서버 성능에 따라 달라질 수 있습니다.

---

### 5단계: 실행 상태 확인

서비스가 정상적으로 실행되고 있는지 확인합니다.

#### 컨테이너 상태 확인

```bash
# 모든 컨테이너 상태 확인
docker-compose ps
```

**정상 실행 시 출력 예시:**

```
NAME                IMAGE                      STATUS
mockup-api          icons-ai-mockup-api        Up (healthy)
mockup-migrate      icons-ai-mockup-migrate    Exited (0)
mockup-postgres     postgres:16-alpine         Up (healthy)
mockup-redis        redis:7-alpine             Up (healthy)
mockup-web          icons-ai-mockup-web        Up
mockup-worker       icons-ai-mockup-worker     Up
```

**✅ 정상 상태:**
- `postgres`, `redis`, `api`: `Up (healthy)` 표시
- `migrate`: `Exited (0)` 표시 (정상 종료)
- `web`, `worker`: `Up` 표시

#### 로그 확인

```bash
# 전체 서비스 로그 실시간 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f worker

# 최근 100줄만 확인
docker-compose logs --tail=100 api
```

#### 헬스체크 확인

```bash
# healthy 상태인 컨테이너만 표시
docker-compose ps | grep "healthy"
```

---

### 6단계: 접속 확인

서비스가 정상적으로 응답하는지 확인합니다.

#### API 서버 헬스체크

```bash
# 터미널에서 헬스체크 API 호출
curl http://localhost:4000/health

# 예상 응답
{"status":"ok","timestamp":"2024-01-20T12:00:00.000Z"}
```

#### 브라우저 접속

- **프론트엔드**: `http://YOUR_SERVER_IP:3000`
- **API 서버**: `http://YOUR_SERVER_IP:4000`
- **API 문서**: `http://YOUR_SERVER_IP:4000/api`

**📝 참고:** `YOUR_SERVER_IP`는 3단계에서 설정한 서버 IP 주소입니다.

#### 방화벽 설정

외부에서 접속하려면 방화벽에서 포트를 열어야 합니다:

```bash
# Ubuntu UFW 사용 시
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
sudo ufw reload
```

---

### 7단계: 종료 및 재시작

서비스를 종료하거나 재시작하는 방법입니다.

#### 전체 종료

```bash
# 모든 컨테이너 종료 및 삭제 (볼륨은 유지)
docker-compose down

# 볼륨까지 완전 삭제 (데이터 초기화)
docker-compose down -v
```

#### 일시 정지 및 재시작

```bash
# 컨테이너 정지 (삭제하지 않음)
docker-compose stop

# 정지된 컨테이너 재시작
docker-compose start

# 특정 서비스만 재시작
docker-compose restart api
docker-compose restart web
```

#### 재빌드

코드가 변경된 경우 재빌드가 필요합니다:

```bash
# 특정 서비스만 재빌드
docker-compose up -d --build api

# 모든 서비스 재빌드
docker-compose up -d --build
```

---

## 문제 해결

배포 중 발생할 수 있는 문제와 해결 방법입니다.

### 포트가 이미 사용 중인 경우

```bash
# 포트를 사용 중인 프로세스 확인
sudo lsof -i :3000
sudo lsof -i :4000
sudo lsof -i :5432

# 프로세스 종료
sudo kill -9 <PID>
```

### Docker 권한 문제

```bash
# Docker 소켓 권한 부여
sudo chmod 666 /var/run/docker.sock

# 또는 사용자를 docker 그룹에 추가 (재로그인 필요)
sudo usermod -aG docker $USER
```

### 컨테이너가 계속 재시작되는 경우

```bash
# 컨테이너 로그 확인
docker-compose logs api
docker-compose logs web

# 특정 컨테이너 상세 정보 확인
docker inspect mockup-api
```

**일반적인 원인:**
- 환경 변수 누락 (`.env` 파일 확인)
- DB 마이그레이션 실패 (migrate 로그 확인)
- 포트 충돌
- 메모리 부족

### 데이터베이스 연결 실패

```bash
# PostgreSQL 컨테이너가 healthy 상태인지 확인
docker-compose ps postgres

# PostgreSQL 로그 확인
docker-compose logs postgres

# 데이터베이스 연결 테스트
docker-compose exec postgres psql -U user -d mockup -c "SELECT 1;"
```

### Redis 연결 실패

```bash
# Redis 컨테이너 상태 확인
docker-compose ps redis

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
# 예상 응답: PONG
```

### 디스크 공간 부족

```bash
# Docker 디스크 사용량 확인
docker system df

# 사용하지 않는 이미지/컨테이너/볼륨 정리
docker system prune -a

# 볼륨까지 정리 (주의: 데이터 삭제됨)
docker system prune -a --volumes
```

### 로그 파일이 너무 큰 경우

```bash
# 모든 컨테이너 정지 및 삭제
docker-compose down

# Docker 시스템 정리
docker system prune -a --volumes

# 재시작
docker-compose up -d --build
```

### API 응답이 느린 경우

```bash
# 서버 리소스 확인
docker stats

# 메모리/CPU 사용량이 높으면 서버 스펙 업그레이드 고려
```

---

## 배포 체크리스트

배포 전에 다음 항목을 확인하세요:

### 사전 준비
- [ ] Docker & Docker Compose 설치 완료
- [ ] Git 설치 완료
- [ ] 서버 방화벽 포트 오픈 (3000, 4000)

### 프로젝트 설정
- [ ] GitHub 저장소 clone 완료
- [ ] `.env` 파일 생성 완료

### 필수 환경 변수 설정
- [ ] `GEMINI_API_KEY` 발급 및 설정
- [ ] `JWT_SECRET` 생성 및 설정
- [ ] `NEXT_PUBLIC_API_URL` 서버 IP로 변경
- [ ] `CORS_ORIGIN` 접속 가능한 주소 추가

### 실행 및 확인
- [ ] `docker-compose up -d --build` 실행
- [ ] 모든 컨테이너 `Up` 또는 `healthy` 상태 확인
- [ ] `migrate` 컨테이너 `Exited (0)` 확인
- [ ] API 헬스체크 응답 확인 (`/health`)
- [ ] 브라우저에서 프론트엔드 접속 테스트

### 보안 설정 (선택)
- [ ] JWT_SECRET을 강력한 랜덤 문자열로 변경
- [ ] CORS_ORIGIN을 실제 사용할 도메인만 허용
- [ ] 불필요한 포트 방화벽 차단
- [ ] PostgreSQL 외부 포트 노출 제거 고려

---

## 추가 참고 자료

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [PostgreSQL Docker 가이드](https://hub.docker.com/_/postgres)
- [Redis Docker 가이드](https://hub.docker.com/_/redis)
- [Gemini API 키 발급](https://makersuite.google.com/app/apikey)

---

## 업데이트 이력

- 2024-01-XX: 초기 배포 가이드 작성

---

**문의사항이나 문제가 발생하면 개발팀에 문의해주세요.**
