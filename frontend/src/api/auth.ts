import api from './client';
import type { AuthRequest, AuthResponse, RegisterRequest, UserDTO } from './types';

export const login = async (credentials: AuthRequest): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
};

export const register = async (details: RegisterRequest): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', details);
  return data;
};

export const getMe = async (): Promise<UserDTO> => {
  const { data } = await api.get<UserDTO>('/auth/me');
  return data;
};
