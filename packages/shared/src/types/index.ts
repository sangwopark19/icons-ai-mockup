import { z } from 'zod';

// ===================
// 사용자 관련 타입
// ===================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastLoginAt: z.coerce.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(100),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ===================
// 프로젝트 관련 타입
// ===================

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요').max(200),
  description: z.string().max(1000).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ===================
// 생성 관련 타입
// ===================

export const GenerationModeEnum = z.enum(['ip_change', 'sketch_to_real']);
export type GenerationMode = z.infer<typeof GenerationModeEnum>;

export const GenerationStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type GenerationStatus = z.infer<typeof GenerationStatusEnum>;

export const GenerationOptionsSchema = z.object({
  preserveStructure: z.boolean().default(false),
  transparentBackground: z.boolean().default(false),
  outputCount: z.number().int().min(1).max(4).default(2),
  preserveHardware: z.boolean().default(false),
  fixedBackground: z.boolean().default(true),
  fixedViewpoint: z.boolean().default(true),
  removeShadows: z.boolean().default(false),
  userInstructions: z.string().max(2000).optional(),
  hardwareSpecInput: z.string().max(2000).optional(),
  hardwareSpecs: z
    .object({
      items: z.array(
        z.object({
          type: z.enum(['zipper', 'ring', 'buckle', 'patch', 'button', 'other']),
          material: z.string(),
          color: z.string(),
          position: z.string(),
          size: z.string().optional(),
        })
      ),
    })
    .optional(),
});

export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;

// ===================
// V2 추가 타입
// ===================

export interface ThoughtSignatureData {
  textSignature?: string;
  imageSignatures: string[];
  createdAt: Date;
}

export interface HardwareSpec {
  items: Array<{
    type: 'zipper' | 'ring' | 'buckle' | 'patch' | 'button' | 'other';
    material: string;
    color: string;
    position: string;
    size?: string;
  }>;
}

export const CreateGenerationSchema = z.object({
  projectId: z.string().uuid(),
  mode: GenerationModeEnum,
  sourceImageId: z.string().uuid().optional(),
  characterId: z.string().uuid().optional(),
  prompt: z.string().max(2000).optional(),
  options: GenerationOptionsSchema.optional(),
});

export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;

export const GenerationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  ipCharacterId: z.string().uuid().nullable(),
  sourceImageId: z.string().uuid().nullable(),
  mode: GenerationModeEnum,
  status: GenerationStatusEnum,
  promptData: z.record(z.unknown()),
  options: GenerationOptionsSchema,
  retryCount: z.number().int(),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});

export type Generation = z.infer<typeof GenerationSchema>;

// ===================
// 이미지 관련 타입
// ===================

export const ImageTypeEnum = z.enum(['source', 'character', 'texture', 'output', 'edited']);
export type ImageType = z.infer<typeof ImageTypeEnum>;

export const GeneratedImageSchema = z.object({
  id: z.string().uuid(),
  generationId: z.string().uuid(),
  filePath: z.string(),
  thumbnailPath: z.string().nullable(),
  type: ImageTypeEnum,
  isSelected: z.boolean(),
  hasTransparency: z.boolean(),
  width: z.number().int(),
  height: z.number().int(),
  fileSize: z.number().int(),
  createdAt: z.coerce.date(),
});

export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;

// ===================
// IP 캐릭터 관련 타입
// ===================

export const IPCharacterSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  filePath: z.string(),
  thumbnailPath: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type IPCharacter = z.infer<typeof IPCharacterSchema>;

export const CreateIPCharacterSchema = z.object({
  name: z.string().min(1, '캐릭터 이름을 입력해주세요').max(100),
});

export type CreateIPCharacterInput = z.infer<typeof CreateIPCharacterSchema>;

// ===================
// API 응답 타입
// ===================

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
