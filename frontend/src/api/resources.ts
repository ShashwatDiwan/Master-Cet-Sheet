import api from './client';
import type { ResourceDTO, ResourceType } from './types';

export const getResourcesByChapter = async (
  chapterId: number,
  type?: ResourceType
): Promise<ResourceDTO[]> => {
  const { data } = await api.get<ResourceDTO[]>(`/chapters/${chapterId}/resources`, {
    params: type ? { type } : undefined,
  });
  return data;
};
