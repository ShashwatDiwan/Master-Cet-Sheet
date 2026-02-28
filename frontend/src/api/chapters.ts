import api from './client';

export const patchChapterStatus = async (
  chapterId: number,
  isCompleted: boolean
): Promise<string | void> => {
  const { data } = await api.patch<string>(`/chapters/${chapterId}/status`, {
    chapterId,
    isCompleted,
  });
  return data;
};

export const patchChapterRevised = async (
  chapterId: number,
  isRevised: boolean
): Promise<string | void> => {
  const { data } = await api.patch<string>(`/chapters/${chapterId}/revised`, {
    chapterId,
    isRevised,
  });
  return data;
};
