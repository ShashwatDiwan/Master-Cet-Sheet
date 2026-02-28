import api from './client';
import type { SheetDTO } from './types';

export const getSheets = async (): Promise<SheetDTO[]> => {
  const { data } = await api.get<SheetDTO[]>('/sheets');
  return data;
};

export const getSheetById = async (id: number): Promise<SheetDTO> => {
  const { data } = await api.get<SheetDTO>(`/sheets/byId/${id}`);
  return data;
};
