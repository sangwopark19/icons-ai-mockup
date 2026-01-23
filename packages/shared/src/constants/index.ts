/**
 * API 엔드포인트 상수
 */
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },

  // 프로젝트
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    DETAIL: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
    HISTORY: (id: string) => `/api/projects/${id}/history`,
    CHARACTERS: (id: string) => `/api/projects/${id}/characters`,
  },

  // 생성
  GENERATIONS: {
    CREATE: '/api/generations',
    DETAIL: (id: string) => `/api/generations/${id}`,
    IMAGES: (id: string) => `/api/generations/${id}/images`,
    SELECT: (id: string) => `/api/generations/${id}/select`,
    EDIT: (id: string) => `/api/generations/${id}/edit`,
  },

  // 이미지
  IMAGES: {
    DETAIL: (id: string) => `/api/images/${id}`,
    DOWNLOAD: (id: string) => `/api/images/${id}/download`,
    DOWNLOAD_2K: (id: string) => `/api/images/${id}/download/2k`,
    DELETE: (id: string) => `/api/images/${id}`,
  },

  // 히스토리
  HISTORY: {
    SAVE: (imageId: string) => `/api/history/${imageId}/save`,
    DELETE: (id: string) => `/api/history/${id}`,
  },

  // 캐릭터
  CHARACTERS: {
    DELETE: (id: string) => `/api/characters/${id}`,
  },
} as const;

/**
 * 파일 업로드 제한
 */
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_DIMENSION: 256, // 최소 256x256px
  MAX_DIMENSION: 4096, // 최대 4096x4096px
  ASPECT_RATIO_MIN: 1 / 3, // 최소 비율 1:3
  ASPECT_RATIO_MAX: 3 / 1, // 최대 비율 3:1
} as const;

/**
 * 생성 관련 상수
 */
export const GENERATION = {
  DEFAULT_OUTPUT_COUNT: 2,
  MAX_OUTPUT_COUNT: 4,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 60000, // 60초
} as const;

/**
 * 업스케일 관련 상수
 */
export const UPSCALE = {
  SCALES: [2, 3, 4] as const,
  DEFAULT_SCALE: 2,
  MODELS: ['realesrgan-x4plus', 'realesrgan-x4plus-anime', 'realesr-animevideov3'] as const,
  DEFAULT_MODEL: 'realesrgan-x4plus',
} as const;

/**
 * 페이지네이션 기본값
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * 에러 코드
 */
export const ERROR_CODES = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 유효성 검사
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 리소스
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // 파일
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INVALID_IMAGE_DIMENSION: 'INVALID_IMAGE_DIMENSION',

  // 생성
  GENERATION_FAILED: 'GENERATION_FAILED',
  GENERATION_TIMEOUT: 'GENERATION_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',

  // 서버
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ===================
// v3 프롬프트 템플릿 (Phase 5.1)
// ===================

/**
 * v3 생성 옵션별 프롬프트 템플릿
 * PRD 명세에 따른 정확한 프롬프트 텍스트
 */
export const PROMPT_TEMPLATES_V3 = {
  /** 시점 고정 프롬프트 */
  VIEWPOINT_LOCK: [
    'Keep the exact same camera angle, perspective, and viewpoint as the original image',
    "Do not change the product's orientation or angle",
  ] as const,

  /** 백색 배경 프롬프트 */
  WHITE_BACKGROUND: [
    'The background must be pure white with no shadows',
    'Clean, studio-lit product photograph on white background',
  ] as const,

  /** 부자재 보존 프롬프트 (스케치 실사화용) */
  ACCESSORY_PRESERVATION: [
    'CRITICAL: Keep all accessories (zippers, key rings, buttons, buckles) exactly as shown in the original',
    'Preserve the exact colors and shapes of all hardware and decorative elements',
    'Do not modify, add, or remove any accessory details',
  ] as const,

  /** 스타일 복사 프롬프트 (IP 변경용) */
  STYLE_COPY: [
    'Maintain the exact same material texture, color tone, and accessory details from the reference image',
    'Only change the character while preserving all other visual elements',
  ] as const,
} as const;

/**
 * 프롬프트 템플릿 키 타입
 */
export type PromptTemplateKey = keyof typeof PROMPT_TEMPLATES_V3;
