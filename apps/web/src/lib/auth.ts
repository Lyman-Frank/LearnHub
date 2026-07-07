import { AuthResponse, User } from './api';

let memoryAuth: AuthResponse | null = null;

export const auth = {
  setAuth(data: AuthResponse) {
    memoryAuth = data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnhub_auth', JSON.stringify(data));
      // Устанавливаем cookie для middleware
      document.cookie = `learnhub_logged_in=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `learnhub_role=${data.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  },

  getAuth(): AuthResponse | null {
    if (memoryAuth) return memoryAuth;
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('learnhub_auth');
      if (stored) {
        try {
          memoryAuth = JSON.parse(stored);
          return memoryAuth;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },

  getUser(): User | null {
    const data = this.getAuth();
    return data ? data.user : null;
  },

  getAccessToken(): string | null {
    const data = this.getAuth();
    return data ? data.accessToken : null;
  },

  getRefreshToken(): string | null {
    const data = this.getAuth();
    return data ? data.refreshToken : null;
  },

  clearAuth() {
    memoryAuth = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('learnhub_auth');
      // Удаляем куки
      document.cookie = 'learnhub_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'learnhub_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  isAuthenticated(): boolean {
    return this.getAuth() !== null;
  }
};
