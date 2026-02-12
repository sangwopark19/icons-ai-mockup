# User Journey
# AI 목업 이미지 프로그램 - 사용자 여정 문서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.1 |
| 작성일 | 2026-01-07 |
| 최종 업데이트 | 2026-02-12 |
| 상태 | Draft |

---

## 1. 사용자 여정 개요

### 1.1 핵심 사용자 플로우

```mermaid
flowchart TB
    Start([시작]) --> Auth{로그인 상태?}
    Auth -->|No| Login[로그인/회원가입]
    Login --> Dashboard
    Auth -->|Yes| Dashboard[대시보드]
    
    Dashboard --> SelectProject{프로젝트 선택}
    SelectProject -->|기존| ProjectDetail[프로젝트 상세]
    SelectProject -->|신규| CreateProject[프로젝트 생성]
    CreateProject --> ProjectDetail
    
    ProjectDetail --> SelectMode{모드 선택}
    SelectMode --> ModeA[A: IP 변경]
    SelectMode --> ModeB[B: 스케치 실사화]
    
    ModeA --> UploadA[이미지 업로드<br/>원본+캐릭터]
    ModeB --> UploadB[이미지 업로드<br/>스케치+참조]
    
    UploadA --> SetOptions[옵션 설정]
    UploadB --> SetOptions
    
    SetOptions --> Generate[목업 생성]
    Generate --> Loading[로딩 화면<br/>2초 간격 폴링]
    Loading --> Result[결과 확인<br/>2장]
    
    Result --> SelectOne[1장 선택]
    SelectOne --> NeedEdit{수정 필요?}
    
    NeedEdit -->|Yes| PartialEdit[부분 수정]
    PartialEdit --> Loading
    NeedEdit -->|No| Save[히스토리 저장]
    
    Save --> Download{다운로드?}
    Download -->|Yes| DownloadFile[1K 파일 다운로드<br/>🚧 2K 업스케일 구현 예정]
    Download -->|No| Continue{계속 작업?}
    DownloadFile --> Continue
    
    Continue -->|Yes| SelectMode
    Continue -->|No| End([종료])
```

---

## 2. 상세 사용자 여정

### 2.1 Journey A: 캐릭터 IP 변경

**시나리오**: 디자이너가 기존 인기 제품에 새로운 캐릭터 IP를 적용한 목업을 생성

```mermaid
flowchart LR
    subgraph phase1 [1. 준비]
        A1[프로젝트 선택/생성]
        A2[IP 변경 모드 선택]
    end
    
    subgraph phase2 [2. 입력]
        B1[원본 제품 이미지 업로드]
        B2[새 캐릭터 IP 업로드]
        B3[옵션 설정]
    end
    
    subgraph phase3 [3. 생성]
        C1[생성 요청]
        C2[처리 중...]
        C3[결과 2장 표시]
    end
    
    subgraph phase4 [4. 선택/수정]
        D1[1장 선택]
        D2[부분 수정 요청]
        D3[수정 결과 확인]
    end
    
    subgraph phase5 [5. 저장]
        E1[히스토리 저장]
        E2[2K 다운로드]
    end
    
    A1 --> A2 --> B1 --> B2 --> B3 --> C1 --> C2 --> C3 --> D1 --> D2 --> D3 --> E1 --> E2
```

#### 단계별 상세

| 단계 | 화면 | 사용자 행동 | 시스템 반응 | 감정 상태 |
|------|------|-------------|-------------|-----------|
| 1 | 대시보드 | 프로젝트 선택 또는 생성 | 프로젝트 상세 페이지 이동 | 중립 |
| 2 | 프로젝트 상세 | "IP 변경" 모드 클릭 | 업로드 화면 표시 | 기대 |
| 3 | 업로드 | 원본 제품 이미지 드래그&드롭 | 이미지 미리보기 표시 | 집중 |
| 4 | 업로드 | 새 캐릭터 IP 이미지 업로드 | 이미지 미리보기 표시 | 집중 |
| 5 | 옵션 | 투명 배경, 구조 우선 등 선택 | 옵션 저장 | 중립 |
| 6 | 생성 | "생성하기" 버튼 클릭 | 로딩 애니메이션 | 기대/긴장 |
| 7 | 결과 | 2장 결과물 확인 | 나란히 비교 뷰 | 흥미/평가 |
| 8 | 결과 | 마음에 드는 1장 클릭 | 선택 표시, 확대 뷰 | 만족/불만 |
| 9 | 수정 | "재질만 매트하게" 입력 | 부분 수정 처리 | 기대 |
| 10 | 결과 | 수정 결과 확인 | 수정된 이미지 표시 | 만족 |
| 11 | 저장 | "저장" 버튼 클릭 | 히스토리에 저장 완료 | 안도 |
| 12 | 다운로드 | "다운로드" 클릭 | 1K 즉시 다운로드 (🚧 2K 업스케일 구현 예정) | 완료감 |

---

### 2.2 Journey B: 스케치 → 실사화

**시나리오**: 디자이너가 손으로 그린 머그컵 스케치를 실제 제품 목업으로 변환

```mermaid
flowchart LR
    subgraph phase1 [1. 준비]
        A1[프로젝트 선택]
        A2[스케치 실사화 모드]
    end
    
    subgraph phase2 [2. 입력]
        B1[스케치 이미지 업로드]
        B2[참조 질감 업로드<br/>선택사항]
        B3[프롬프트 입력]
    end
    
    subgraph phase3 [3. 생성]
        C1[생성 요청]
        C2[처리 중...]
        C3[결과 2장 표시]
    end
    
    subgraph phase4 [4. 반복]
        D1[1장 선택]
        D2[부분 수정]
        D3[만족할 때까지 반복]
    end
    
    subgraph phase5 [5. 완료]
        E1[저장 및 다운로드]
    end
    
    A1 --> A2 --> B1 --> B2 --> B3 --> C1 --> C2 --> C3 --> D1 --> D2 --> D3 --> E1
```

#### 입력 화면 상세

```
┌─────────────────────────────────────────────────────┐
│  스케치 → 실사화                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐        │
│  │                 │    │                 │        │
│  │   스케치 이미지   │    │  참조 질감 이미지  │        │
│  │   (필수)        │    │  (선택)         │        │
│  │                 │    │                 │        │
│  │  [이미지 업로드]  │    │  [이미지 업로드]  │        │
│  └─────────────────┘    └─────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 추가 설명 (선택)                              │   │
│  │ 예: 광택 있는 도자기 재질, 파스텔 색감         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☑ 투명 배경으로 생성                               │
│  ☐ 구조 우선 (스케치 형태 엄격히 유지)               │
│                                                     │
│              [ 목업 생성하기 ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 2.3 Journey C: 히스토리 관리

**시나리오**: 이전에 생성한 목업을 불러와 재사용 또는 수정

```mermaid
flowchart TB
    Start[프로젝트 히스토리 열기] --> Browse[저장된 목업 탐색]
    Browse --> Select[마음에 드는 목업 선택]
    Select --> Action{액션 선택}

    Action -->|1. 다운로드| Download[1K 다운로드]
    Action -->|2. ✏️ 부분 수정| Edit[부분 수정]
    Action -->|3. 📚 히스토리에 저장| AlreadySaved[이미 저장됨]
    Action -->|4. 🎨 스타일 복사 IP| StyleIP[IP 변경 모드]
    Action -->|5. 🧩 스타일 복사 새제품| StyleSketch[스케치 실사화 모드]
    Action -->|6. 🔁 동일 조건 재생성| Regenerate[재생성]
    Action -->|7. 🛠️ 조건 수정| ModifyRegenerate[조건 수정 후 재생성]

    Edit --> Save[저장]
    StyleIP --> NewUpload[새 이미지 업로드]
    StyleSketch --> NewUpload
    NewUpload --> Generate[스타일 적용 생성]
    Regenerate --> Generate
    ModifyRegenerate --> ModifyOptions[옵션 수정]
    ModifyOptions --> Generate
    Generate --> Result[결과 확인]
```

#### 히스토리 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  프로젝트: 2026 봄 신상품                   [정렬 ▼]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐      │
│  │     │  │     │  │     │  │     │  │     │      │
│  │ 목업1 │  │ 목업2 │  │ 목업3 │  │ 목업4 │  │ 목업5 │      │
│  │     │  │     │  │     │  │     │  │     │      │
│  ├─────┤  ├─────┤  ├─────┤  ├─────┤  ├─────┤      │
│  │01/05│  │01/04│  │01/03│  │01/02│  │01/01│      │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘      │
│                                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐                         │
│  │     │  │     │  │     │                         │
│  │ 목업6 │  │ 목업7 │  │ 목업8 │                         │
│  │     │  │     │  │     │                         │
│  ├─────┤  ├─────┤  ├─────┤                         │
│  │12/28│  │12/27│  │12/25│                         │
│  └─────┘  └─────┘  └─────┘                         │
│                                                     │
│  ─────────── 더 보기 ───────────                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. 기능별 상세 플로우

### 3.1 이미지 업로드 플로우

```mermaid
flowchart TB
    Start[업로드 영역] --> Method{업로드 방식}
    Method -->|드래그앤드롭| Drop[파일 드롭]
    Method -->|클릭| Click[파일 선택 다이얼로그]
    Method -->|붙여넣기| Paste[클립보드에서 붙여넣기]
    
    Drop --> Validate
    Click --> Validate
    Paste --> Validate
    
    Validate{유효성 검사}
    Validate -->|성공| Preview[미리보기 표시]
    Validate -->|실패| Error[에러 메시지]
    
    Error --> Method
    Preview --> Confirm{확인}
    Confirm -->|변경| Method
    Confirm -->|확정| Done[업로드 완료]
```

#### 유효성 검사 규칙

| 항목 | 규칙 | 에러 메시지 |
|------|------|-------------|
| 파일 형식 | PNG, JPG, WEBP만 허용 | "지원하지 않는 파일 형식입니다" |
| 파일 크기 | 최대 10MB | "파일 크기가 10MB를 초과합니다" |
| 이미지 크기 | 최소 256x256px | "이미지 해상도가 너무 낮습니다" |
| 이미지 비율 | 1:3 ~ 3:1 | "이미지 비율이 너무 극단적입니다" |

---

### 3.2 목업 생성 플로우

```mermaid
flowchart TB
    Request[생성 요청] --> Queue[작업 큐 등록]
    Queue --> Redirect[결과 페이지 리다이렉트]
    Redirect --> Poll[2초 간격 폴링 시작]

    Poll --> Status{처리 상태}
    Status -->|pending| Wait[대기 중...]
    Wait --> Poll
    Status -->|processing| Loading[생성 중...<br/>진행 표시]
    Loading --> Poll

    Status -->|completed| Success[결과 이미지 2장 표시]
    Status -->|failed| Fail[에러 화면]
    Status -->|401 Unauthorized| Logout[자동 로그아웃]

    Success --> Display[결과 화면]
    Fail --> Recover[다시 시도 버튼]
    Logout --> LoginPage[로그인 페이지]
    Recover --> Request
```

#### 로딩 화면 상태

**폴링 로직**:
- 생성 요청 후 즉시 결과 페이지로 리다이렉트
- 2초 간격으로 서버에 상태 조회 (GET /api/generations/:id)
- 상태 변화: `pending` → `processing` → `completed` / `failed`
- 401 Unauthorized 에러 시 자동 로그아웃 처리

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    🎨 목업 생성 중...                │
│                                                     │
│           ████████████░░░░░░░░░░░░  45%            │
│                                                     │
│              상태: processing                        │
│              2초마다 자동 갱신 중...                  │
│                                                     │
│         ─────────────────────────────               │
│                                                     │
│         💡 Tip: 캐릭터의 비율을 유지하면서            │
│            제품에 자연스럽게 적용하고 있어요          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 3.3 부분 수정 플로우

```mermaid
flowchart TB
    Selected[선택된 이미지] --> EditBtn[✏️ 부분 수정 버튼]
    EditBtn --> Input[수정 프롬프트 입력]

    Input --> Examples{예시}
    Examples --> Ex1["재질만 매트하게"]
    Examples --> Ex2["색상을 빨간색으로"]
    Examples --> Ex3["캐릭터 크기 10% 축소"]

    Ex1 --> Submit
    Ex2 --> Submit
    Ex3 --> Submit
    Input --> Submit[수정 요청 제출]

    Submit --> Queue[작업 큐 등록]
    Queue --> Poll[2초 간격 폴링]
    Poll --> Status{상태}
    Status -->|processing| Poll
    Status -->|completed| Compare[원본과 비교 표시]
    Status -->|failed| Error[에러 메시지]

    Compare --> Confirm{만족?}

    Confirm -->|Yes| Save[저장]
    Confirm -->|No| Revert{되돌리기?}

    Revert -->|원본으로| Selected
    Revert -->|재수정| Input
    Error --> Retry[다시 시도]
    Retry --> Input
```

#### 부분 수정 UI

```
┌─────────────────────────────────────────────────────┐
│  부분 수정                                    [닫기] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │                  │  │                  │        │
│  │     원본 이미지    │  │    수정된 이미지   │        │
│  │                  │  │                  │        │
│  │                  │  │   (수정 후 표시)   │        │
│  │                  │  │                  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 수정 요청을 입력하세요                        │   │
│  │ 예: "배경 색상만 하늘색으로 변경해줘"          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ⚠️ 요청한 부분 외에는 변경되지 않습니다             │
│                                                     │
│  자주 쓰는 수정:                                    │
│  [재질 변경] [색상 변경] [크기 조절] [위치 이동]      │
│                                                     │
│         [ 취소 ]          [ 수정하기 ]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 3.4 다운로드 플로우

```mermaid
flowchart TB
    Image[선택된 이미지] --> DownloadBtn[다운로드 버튼]
    DownloadBtn --> Direct[1K 즉시 다운로드]
    Direct --> Complete[다운로드 완료 알림]

    Note[🚧 2K 업스케일 다운로드<br/>구현 예정]

    style Note fill:#fff3cd,stroke:#856404
```

---

### 3.5 스타일 복사 플로우

```mermaid
flowchart TB
    Result[기존 생성 결과] --> StyleBtn[스타일 복사 버튼 클릭]
    StyleBtn --> ModeSelect{모드 선택}

    ModeSelect -->|🎨 IP 변경| IPMode[IP 변경 작업 시작]
    ModeSelect -->|🧩 새 제품| SketchMode[스케치 실사화 시작]

    IPMode --> UploadIP[원본+캐릭터 업로드]
    SketchMode --> UploadSketch[스케치 업로드]

    UploadIP --> ApplyStyle[thoughtSignature 적용]
    UploadSketch --> ApplyStyle

    ApplyStyle --> Generate[스타일 기반 생성]
    Generate --> Poll[2초 간격 폴링]
    Poll --> NewResult[새 결과 (동일 스타일)]
```

#### 스타일 복사 동작 방식

**스타일 복사는 기존 생성 결과의 "느낌"을 새로운 작업에 적용합니다:**

1. **thoughtSignature 저장**: Gemini API가 이미지 생성 시 만든 내부 메타데이터
2. **스타일 적용**: 새 작업에 동일한 thoughtSignature를 참조하여 생성
3. **결과**: 색감, 분위기, 표현 방식이 유사한 새 이미지

**예시**:
- A 제품에서 생성한 "파스텔 톤, 귀여운 느낌" → B 제품에 동일 스타일 적용
- 마음에 드는 배경 분위기 → 다른 제품에도 동일한 배경 스타일 사용

---

## 4. 에러 처리 플로우

### 4.1 에러 유형별 처리

```mermaid
flowchart TB
    Error[에러 발생] --> Type{에러 유형}

    Type -->|401 Unauthorized| AuthFail[세션 만료<br/>자동 로그아웃]
    Type -->|네트워크| Network[연결 확인 메시지<br/>+ 재시도 버튼]
    Type -->|API 한도| RateLimit[잠시 후 재시도 안내<br/>+ 남은 시간 표시]
    Type -->|생성 실패| GenFail[자동 재시도 3회<br/>→ 수동 재시도 안내]
    Type -->|파일 오류| FileFail[파일 형식/크기<br/>오류 안내]
    Type -->|서버 오류| ServerFail[고객센터 문의 안내<br/>+ 에러 코드]

    AuthFail --> Login[로그인 페이지]
    Network --> Retry[재시도]
    RateLimit --> Wait[대기]
    GenFail --> Retry
    FileFail --> Reupload[다시 업로드]
    ServerFail --> Report[문제 보고]
```

### 4.2 에러 메시지 가이드

| 에러 코드 | 사용자 메시지 | 액션 버튼 |
|-----------|---------------|-----------|
| AUTH_401 | 세션이 만료되었습니다. 다시 로그인해주세요 | [로그인 페이지로] |
| NET_001 | 인터넷 연결을 확인해주세요 | [다시 시도] |
| API_429 | 요청이 많아요. 30초 후 다시 시도해주세요 | [자동 재시도: 30s] |
| GEN_001 | 이미지 생성에 실패했어요. 다시 시도할까요? | [다시 생성] |
| FILE_001 | PNG, JPG, WEBP 파일만 업로드할 수 있어요 | [다른 파일 선택] |
| FILE_002 | 파일이 너무 커요 (최대 10MB) | [다른 파일 선택] |
| SRV_500 | 일시적인 오류가 발생했어요 | [문의하기] |

---

## 5. 화면 전환 맵

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Dashboard: 로그인 성공
    
    Dashboard --> ProjectList: 프로젝트 보기
    Dashboard --> NewProject: 새 프로젝트
    
    ProjectList --> ProjectDetail: 프로젝트 선택
    NewProject --> ProjectDetail: 생성 완료
    
    ProjectDetail --> IPChange: IP 변경 모드
    ProjectDetail --> SketchToReal: 스케치 실사화 모드
    ProjectDetail --> History: 히스토리 보기
    
    IPChange --> Generation: 생성
    SketchToReal --> Generation: 생성
    
    Generation --> Result: 완료
    Result --> PartialEdit: 수정
    PartialEdit --> Result: 수정 완료
    
    Result --> History: 저장
    History --> ProjectDetail: 뒤로가기
    
    ProjectDetail --> Dashboard: 뒤로가기
```

---

## 6. 터치포인트 및 감정 곡선

### 6.1 감정 곡선 (IP 변경 작업 기준)

```
만족도
  ^
  │
높음│                              ★ 결과 만족
  │                        ┌───────────────────
  │                    ┌───┘
  │        ★ 업로드 완료  │
  │    ┌───────────────┘
중간│────┘
  │            ⏳ 생성 대기
  │    
낮음│
  │
  └────────────────────────────────────────────> 시간
     로그인  업로드  옵션  생성중  결과  수정  저장  다운로드
```

### 6.2 핵심 터치포인트

| 단계 | 터치포인트 | 사용자 기대 | 디자인 고려사항 |
|------|------------|-------------|-----------------|
| 업로드 | 드래그&드롭 영역 | 직관적이고 빠른 업로드 | 넓은 드롭존, 즉각적 피드백 |
| 생성 대기 | 로딩 화면 | 진행 상황 파악 | 진행률, 예상 시간, 팁 제공 |
| 결과 확인 | 2장 비교 뷰 | 쉬운 비교 및 선택 | 나란히 배치, 확대 기능 |
| 부분 수정 | 프롬프트 입력 | 의도대로 수정됨 | 예시 제공, 명확한 가이드 |
| 다운로드 | 해상도 선택 | 고품질 결과물 | 빠른 업스케일, 포맷 선택 |

---

## 7. 접근성 고려사항

### 7.1 키보드 네비게이션
- 모든 기능 Tab/Enter로 접근 가능
- 이미지 선택: 화살표 키로 이동, Enter로 선택
- 모달 닫기: ESC 키

### 7.2 스크린 리더 지원
- 모든 이미지에 alt 텍스트 제공
- 상태 변경 시 aria-live 알림
- 버튼/링크에 명확한 레이블

### 7.3 시각적 피드백
- 호버/포커스 상태 명확히 구분
- 색상만으로 정보 전달하지 않음
- 충분한 색상 대비 (WCAG AA)

---

## 부록: 사용자 시나리오 예시

### 시나리오 1: 신입 디자이너의 첫 사용

```
김디자이너(신입)가 처음으로 AI 목업 도구를 사용합니다.

1. 로그인 후 "새 프로젝트 만들기" 버튼을 클릭
2. 프로젝트명 "라인프렌즈 머그컵 테스트" 입력
3. "IP 변경" 모드 선택
4. 기존 카카오프렌즈 머그컵 이미지 드래그&드롭
5. 라인프렌즈 브라운 캐릭터 이미지 업로드
6. "투명 배경" 옵션 체크
7. "생성하기" 클릭 → 25초 대기
8. 2장 결과물 중 왼쪽 이미지 선택
9. "✏️ 부분 수정" 클릭 → "손잡이 색상만 검정으로" 입력
10. 수정 완료 대기 (2초 간격 폴링)
11. 수정된 결과 확인 후 "📚 히스토리에 저장"
12. "다운로드" 버튼으로 1K 이미지 다운로드
13. 선임에게 결과물 공유

소요시간: 약 3분

**참고**: 🚧 2K 업스케일 다운로드는 구현 예정
```

### 시나리오 2: 경력 디자이너의 배치 작업

```
박디자이너(5년차)가 여러 캐릭터 IP를 동일 제품에 적용합니다.

1. 기존 프로젝트 "2026 봄 텀블러 라인업" 선택
2. 히스토리에서 잘 나온 "미니언즈 텀블러" 목업 선택
3. "🎨 스타일 복사 (IP 변경)" 클릭
4. 새 캐릭터 IP (스폰지밥) 업로드
5. thoughtSignature 기반으로 동일 스타일 적용 생성
6. 2초 간격 폴링으로 결과 대기
7. 결과 확인 후 "📚 히스토리에 저장"
8. 다른 IP (뽀로로)로 "🔁 동일 조건 재생성" 반복...

1개 IP당 소요시간: 약 1분
```
