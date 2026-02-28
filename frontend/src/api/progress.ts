import api from './client';
import type { ProgressUpdateDTO, ChapterProgressDTO } from './types';

export const upsertProgress = async (dto: ProgressUpdateDTO): Promise<ChapterProgressDTO> => {
  const { data } = await api.post<ChapterProgressDTO>('/progress', dto);
  return data;
};

export const getProgress = async (): Promise<ChapterProgressDTO[]> => {
  const { data } = await api.get<ChapterProgressDTO[]>('/progress');
  return data;
};

export const getProgressForSheet = async (sheetId: number): Promise<ChapterProgressDTO[]> => {
  const { data } = await api.get<ChapterProgressDTO[]>(`/progress/sheet/${sheetId}`);
  return data;
};
