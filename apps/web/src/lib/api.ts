export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'TEACHER';
  inviteCode?: string;
  institutionType?: string;
  institutionName?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const authData = localStorage.getItem('learnhub_auth');
  if (!authData) return false;
  try {
    const { refreshToken } = JSON.parse(authData);
    if (!refreshToken) return false;
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Обновляем токены в хранилище
    const parsed = JSON.parse(authData);
    parsed.accessToken = data.accessToken;
    if (data.refreshToken) parsed.refreshToken = data.refreshToken;
    localStorage.setItem('learnhub_auth', JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

async function fetchApi<T>(
  path: string,
  method: string = 'GET',
  body?: any,
  customHeaders?: Record<string, string>
): Promise<T> {
  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('learnhub_auth');
      if (authData) {
        try {
          const { accessToken } = JSON.parse(authData);
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        } catch {
          // ignore
        }
      }
    }
    return headers;
  };

  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch();

  // Если 401 — пробуем обновить токен и повторить запрос
  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken().then((ok) => {
        isRefreshing = false;
        if (!ok) {
          // Сессия истекла — чистим данные
          if (typeof window !== 'undefined') {
            localStorage.removeItem('learnhub_auth');
          }
        }
      });
    }
    await refreshPromise;
    // Повторяем оригинальный запрос с новым токеном
    response = await doFetch();
  }

  if (!response.ok) {
    let errorMessage = 'Произошла ошибка при выполнении запроса';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.join(', ');
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}


export const api = {
  baseUrl: BASE_URL,
  async register(data: RegisterData): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/register', 'POST', data);
  },

  async login(email: string, password?: string): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/login', 'POST', { email, password });
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return fetchApi<{ accessToken: string; refreshToken: string }>('/auth/refresh', 'POST', { refreshToken });
  },

  async logout(refreshToken: string): Promise<void> {
    return fetchApi<void>('/auth/logout', 'POST', { refreshToken });
  },

  async getMe(): Promise<User> {
    return fetchApi<User>('/auth/me', 'GET');
  },

  async getInvites(): Promise<any[]> {
    return fetchApi<any[]>('/invites', 'GET');
  },

  async createInvite(data: { maxUses?: number; expiresInDays?: number; durationDays?: number }): Promise<any> {
    return fetchApi<any>('/invites', 'POST', data);
  },

  async deactivateInvite(id: string): Promise<any> {
    return fetchApi<any>(`/invites/${id}/deactivate`, 'PATCH');
  },

  // === МИНИ-ИГРЫ ===
  async getMinigameProgress(gameType: string): Promise<any[]> {
    return fetchApi<any[]>(`/minigames/progress/${gameType}`, 'GET');
  },

  async completeMinigameLevel(gameType: string, levelId: string, stars: number = 0): Promise<any> {
    return fetchApi<any>('/minigames/complete', 'POST', { gameType, levelId, stars });
  },

  async getMinigameConfig(): Promise<any> {
    return fetchApi<any>('/minigames/config', 'GET');
  },

  async updateMinigameConfig(config: Record<string, number>): Promise<any> {
    return fetchApi<any>('/minigames/config', 'POST', { config });
  },

  // === КУРСЫ ===
  async getAuthorCourses(): Promise<any[]> {
    return fetchApi<any[]>('/courses/author', 'GET');
  },

  async getCatalog(params?: { search?: string; page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return fetchApi<any>(`/courses/catalog${qs ? `?${qs}` : ''}`, 'GET');
  },

  async getStudentMyCourses(): Promise<any[]> {
    return fetchApi<any[]>('/courses/student/my', 'GET');
  },

  async enrollCourse(id: string): Promise<any> {
    return fetchApi<any>(`/courses/${id}/enroll`, 'POST');
  },

  async getCourse(id: string): Promise<any> {
    return fetchApi<any>(`/courses/${id}`, 'GET');
  },

  async getEnrollment(courseId: string): Promise<any> {
    return fetchApi<any>(`/courses/${courseId}/enrollment`, 'GET').catch(() => null);
  },

  async createCourse(data: { title: string; description?: string; coverUrl?: string }): Promise<any> {
    return fetchApi<any>('/courses', 'POST', data);
  },

  async updateCourse(id: string, data: { title?: string; description?: string; coverUrl?: string; status?: string; xp?: number | null; password?: string | null }): Promise<any> {
    return fetchApi<any>(`/courses/${id}`, 'PATCH', data);
  },

  async deleteCourse(id: string): Promise<any> {
    return fetchApi<any>(`/courses/${id}`, 'DELETE');
  },

  // === МОДУЛИ ===
  async createModule(data: { title: string; position: number; courseId: string }): Promise<any> {
    return fetchApi<any>('/modules', 'POST', data);
  },

  async updateModule(id: string, data: { title?: string; position?: number; xp?: number | null; password?: string | null; isArchived?: boolean; availableAt?: string | null; deadlineAt?: string | null }): Promise<any> {
    return fetchApi<any>(`/modules/${id}`, 'PATCH', data);
  },

  async deleteModule(id: string): Promise<any> {
    return fetchApi<any>(`/modules/${id}`, 'DELETE');
  },

  // === УРОКИ ===
  async createLesson(data: { title: string; position: number; moduleId: string }): Promise<any> {
    return fetchApi<any>('/lessons', 'POST', data);
  },

  async updateLesson(id: string, data: { title?: string; position?: number; isArchived?: boolean; availableAt?: string | null; deadlineAt?: string | null }): Promise<any> {
    return fetchApi<any>(`/lessons/${id}`, 'PATCH', data);
  },

  async deleteLesson(id: string): Promise<any> {
    return fetchApi<any>(`/lessons/${id}`, 'DELETE');
  },

  // === ШАГИ ===
  async createStep(data: { title: string; type: string; position: number; lessonId: string; content?: any }): Promise<any> {
    return fetchApi<any>('/steps', 'POST', data);
  },

  async updateStep(id: string, data: { title?: string; type?: string; position?: number; content?: any; xp?: number | null; isArchived?: boolean }): Promise<any> {
    return fetchApi<any>(`/steps/${id}`, 'PATCH', data);
  },

  async deleteStep(id: string): Promise<any> {
    return fetchApi<any>(`/steps/${id}`, 'DELETE');
  },

  // === ADMIN: МОДЕРАЦИЯ КУРСОВ ===
  async adminGetAllCourses(): Promise<any[]> {
    return fetchApi<any[]>('/courses/admin/all', 'GET');
  },

  async adminUpdateCourseStatus(id: string, status: string): Promise<any> {
    return fetchApi<any>(`/courses/admin/${id}/status`, 'PATCH', { status });
  },

  // === ПРОГРЕСС ===
  async completeStep(stepId: string, answer?: string, isCorrect?: boolean, timeSpent?: number): Promise<any> {
    return fetchApi<any>(`/progress/steps/${stepId}/complete`, 'POST', { answer, isCorrect, timeSpent });
  },

  async runCode(stepId: string, code: string, stdin?: string): Promise<any> {
    return fetchApi<any>(`/progress/steps/${stepId}/run-code`, 'POST', { code, stdin });
  },

  async getCourseProgress(courseId: string): Promise<any> {
    return fetchApi<any>(`/progress/courses/${courseId}`, 'GET');
  },

  async getUserStats(): Promise<any> {
    return fetchApi<any>('/progress/stats', 'GET');
  },

  async getLeaderboard(): Promise<any[]> {
    return fetchApi<any[]>('/progress/leaderboard', 'GET');
  },

  // === ГАЛЕРЕЯ ===
  async getGallery(): Promise<{ categories: Record<string, any[]> }> {
    return fetchApi<any>('/gallery', 'GET');
  },

  async addGalleryImageByUrl(category: string, url: string, label: string): Promise<any> {
    return fetchApi<any>('/gallery/image/url', 'POST', { category, url, label });
  },

  async deleteGalleryImage(id: string): Promise<any> {
    return fetchApi<any>(`/gallery/image/${id}`, 'DELETE');
  },

  async addGalleryCategory(name: string): Promise<any> {
    return fetchApi<any>('/gallery/category', 'POST', { name });
  },

  async deleteGalleryCategory(name: string): Promise<any> {
    return fetchApi<any>(`/gallery/category/${encodeURIComponent(name)}`, 'DELETE');
  },

  async addGalleryImageUpload(file: File, category: string, label: string): Promise<any> {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('learnhub_auth');
        if (authData) {
          const { accessToken } = JSON.parse(authData);
          token = accessToken || null;
        }
      } catch { /* ignore */ }
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('label', label);
    const response = await fetch(`${BASE_URL}/gallery/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // === ЗАГРУЗКА ФАЙЛОВ ===
  async uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
    // Читаем токен из того же хранилища, что и fetchApi
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('learnhub_auth');
        if (authData) {
          const { accessToken } = JSON.parse(authData);
          token = accessToken || null;
        }
      } catch {
        // ignore
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // === ДОСТИЖЕНИЯ И СЕРТИФИКАТЫ ===
  async getMyBadges(): Promise<any[]> {
    return fetchApi<any[]>('/badges/my', 'GET');
  },

  async getMyCertificates(): Promise<any[]> {
    return fetchApi<any[]>('/certificates/my', 'GET');
  },

  async downloadCertificate(courseId: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('learnhub_auth');
      if (authData) {
        try {
          const { accessToken } = JSON.parse(authData);
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        } catch {}
      }
    }
    const response = await fetch(`${BASE_URL}/certificates/${courseId}/download`, { headers });
    if (!response.ok) throw new Error('Ошибка при скачивании сертификата');
    return response.blob();
  },

  async getAiHint(stepId: string, code: string): Promise<{ hint: string }> {
    return fetchApi<{ hint: string }>(`/ai/steps/${stepId}/hint`, 'POST', { code });
  },

  async getAiStatus(): Promise<{ enabled: boolean }> {
    return fetchApi<{ enabled: boolean }>('/ai/status', 'GET');
  },

  async getUserProfile(userId: string): Promise<any> {
    return fetchApi<any>(`/progress/users/${userId}/profile`, 'GET');
  },

  // === ПАРОЛИ И ЧАСТНЫЕ КУРСЫ ===
  async unlockCourse(id: string, password: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/courses/${id}/unlock`, 'POST', { password });
  },

  async unlockModule(moduleId: string, password: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/courses/modules/${moduleId}/unlock`, 'POST', { password });
  },

  // === ПАНЕЛЬ ПРЕПОДАВАТЕЛЯ: СТУДЕНТЫ ===
  async getCourseStudents(courseId: string): Promise<any[]> {
    return fetchApi<any[]>(`/courses/${courseId}/teacher/students`, 'GET');
  },

  async getStudentDetailedProgress(courseId: string, studentId: string): Promise<any> {
    return fetchApi<any>(`/courses/${courseId}/teacher/students/${studentId}`, 'GET');
  },

  // === ЧАТ И ЛИЧНЫЕ СООБЩЕНИЯ ===
  async getGlobalMessages(): Promise<any[]> {
    return fetchApi<any[]>('/chat/global', 'GET');
  },

  async sendGlobalMessage(message: string): Promise<any> {
    return fetchApi<any>('/chat/global', 'POST', { message });
  },

  async getConversations(): Promise<any[]> {
    return fetchApi<any[]>('/chat/dm/conversations', 'GET');
  },

  async getDirectMessagesHistory(userId: string): Promise<any[]> {
    return fetchApi<any[]>(`/chat/dm/${userId}`, 'GET');
  },

  async sendDirectMessage(recipientId: string, message: string): Promise<any> {
    return fetchApi<any>('/chat/dm', 'POST', { recipientId, message });
  },

  async markDirectMessagesAsRead(userId: string): Promise<any> {
    return fetchApi<any>(`/chat/dm/${userId}/read`, 'PATCH');
  },

  // === УВЕДОМЛЕНИЯ ===
  async getNotifications(): Promise<any[]> {
    return fetchApi<any[]>('/notifications', 'GET');
  },

  async markNotificationAsRead(id: string): Promise<any> {
    return fetchApi<any>(`/notifications/${id}/read`, 'PATCH');
  },

  async markAllNotificationsAsRead(): Promise<any> {
    return fetchApi<any>('/notifications/read-all', 'PATCH');
  },

  // === АДМИН: МОДЕРАЦИЯ (ОТКЛОНЕНИЕ) ===
  async adminRejectCourse(id: string, reason: string): Promise<any> {
    return fetchApi<any>(`/courses/admin/${id}/reject`, 'POST', { reason });
  },

  // === ГРУППЫ / КЛАССЫ ===
  async createGroup(name: string, courseId?: string): Promise<any> {
    return fetchApi<any>('/groups', 'POST', { name, courseId });
  },

  async joinGroup(code: string): Promise<any> {
    return fetchApi<any>('/groups/join', 'POST', { code });
  },

  async getTeacherGroups(): Promise<any[]> {
    return fetchApi<any[]>('/groups/teacher', 'GET');
  },

  async getTeacherGroup(id: string): Promise<any> {
    return fetchApi<any>(`/groups/teacher/${id}`, 'GET');
  },

  async getStudentGroups(): Promise<any[]> {
    return fetchApi<any[]>('/groups/student', 'GET');
  },

  async deleteGroup(id: string): Promise<any> {
    return fetchApi<any>(`/groups/${id}`, 'DELETE');
  },

  async getGroupRealtimeActivity(id: string): Promise<any[]> {
    return fetchApi<any[]>(`/groups/teacher/${id}/realtime`, 'GET');
  },

  async getGroupsLeaderboard(): Promise<any[]> {
    return fetchApi<any[]>('/groups/leaderboard', 'GET');
  },

  // === МАГАЗИН ГЕЙМИФИКАЦИИ ===
  async getShopItems(): Promise<any[]> {
    return fetchApi<any[]>('/shop', 'GET');
  },

  async buyShopItem(id: string): Promise<any> {
    return fetchApi<any>(`/shop/buy/${id}`, 'POST');
  },

  async equipShopItem(id: string): Promise<any> {
    return fetchApi<any>(`/shop/equip/${id}`, 'POST');
  },

  async unequipShopItem(id: string): Promise<any> {
    return fetchApi<any>(`/shop/unequip/${id}`, 'POST');
  },

  async activateInviteKey(inviteCode: string): Promise<any> {
    return fetchApi<any>('/auth/activate-key', 'POST', { inviteCode });
  },

  async createShopItem(data: {
    title: string;
    description?: string;
    cost: number;
    type: string;
    imageUrl?: string;
    metadata?: string;
    requiredCoursesCount?: number;
    requiredStreakDays?: number;
  }): Promise<any> {
    return fetchApi<any>('/shop/admin/create', 'POST', data);
  },

  async deleteShopItem(id: string): Promise<any> {
    return fetchApi<any>(`/shop/admin/delete/${id}`, 'DELETE');
  },

  async updateShopItem(id: string, data: any): Promise<any> {
    return fetchApi<any>(`/shop/admin/update/${id}`, 'POST', data);
  },

  async updateProfile(data: any): Promise<any> {
    return fetchApi<any>('/auth/profile', 'POST', data);
  },

  async updatePrivacy(data: any): Promise<any> {
    return fetchApi<any>('/auth/privacy', 'POST', data);
  },
};

