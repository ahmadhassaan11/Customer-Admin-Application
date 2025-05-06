import { UserProfile } from './types';
import { apiRequest } from './queryClient';

let user: UserProfile | null = null;

export const login = async (username: string, password: string): Promise<UserProfile> => {
  const res = await apiRequest('POST', '/api/auth/login', { username, password });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  
  user = await res.json();
  return user;
};

export const logout = async (): Promise<void> => {
  await apiRequest('POST', '/api/auth/logout');
  user = null;
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  if (user) return user;
  
  try {
    const res = await apiRequest('GET', '/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      user = data.user;
      return user;
    }
  } catch (err) {
    // Not authenticated
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  return user !== null;
};

export const isAdmin = (): boolean => {
  return user?.isAdmin || false;
};
