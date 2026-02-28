// Backend DTO shapes
export interface ChapterDTO {
  chapterId: number;
  chapterName: string;
  Completed: boolean;
  Revised: boolean;
  weightage: number;
  hasNotes: boolean;
  hasShortNotes: boolean;
  hasPyqs: boolean;
}

export interface SheetDTO {
  sheetId: number;
  sheetName: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | string;
  description: string;
  totalChapters: number;
  completedChapters: number;
  chapters: ChapterDTO[];
}

export type ResourceType = 'NOTES' | 'SHORT_NOTES' | 'PYQS';

export interface ResourceDTO {
  resourceId: number;
  resourceName: string;
  type: ResourceType;
  driveFileId: string;
  previewUrl?: string;
}

// auth
export interface AuthRequest {
  email: string;
  password: string;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
}

// progress (matches backend ChapterProgressDTO)
export interface ChapterProgressDTO {
  id: number;
  chapterId: number;
  sheetId: number;
  completed: boolean;
  revised: boolean;
}

export interface ProgressUpdateDTO {
  chapterId: number;
  completed?: boolean;
  revised?: boolean;
}
