export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  courses: {
    base: '/courses',
    byId: (id: string) => `/courses/${id}`,
    publish: (id: string) => `/courses/${id}/publish`,
    archive: (id: string) => `/courses/${id}/archive`,
  },
  modules: {
    base: (courseId: string) => `/courses/${courseId}/modules`,
    byId: (courseId: string, moduleId: string) =>
      `/courses/${courseId}/modules/${moduleId}`,
    reorder: (courseId: string) => `/courses/${courseId}/modules/reorder`,
  },
  lessons: {
    base: (moduleId: string) => `/modules/${moduleId}/lessons`,
    byId: (moduleId: string, lessonId: string) =>
      `/modules/${moduleId}/lessons/${lessonId}`,
    reorder: (moduleId: string) => `/modules/${moduleId}/lessons/reorder`,
  },
  steps: {
    base: (lessonId: string) => `/lessons/${lessonId}/steps`,
    byId: (lessonId: string, stepId: string) =>
      `/lessons/${lessonId}/steps/${stepId}`,
    reorder: (lessonId: string) => `/lessons/${lessonId}/steps/reorder`,
  },
  enrollments: {
    base: '/enrollments',
    byId: (id: string) => `/enrollments/${id}`,
    myCourses: '/enrollments/my-courses',
  },
  progress: {
    submit: (stepId: string) => `/progress/${stepId}/submit`,
    byCourse: (courseId: string) => `/progress/course/${courseId}`,
    byUser: (userId: string) => `/progress/user/${userId}`,
  },
  invites: {
    base: '/invites',
    byId: (id: string) => `/invites/${id}`,
    validate: (code: string) => `/invites/validate/${code}`,
  },
  analytics: {
    overview: '/analytics/overview',
    courseStats: (courseId: string) => `/analytics/courses/${courseId}`,
    userStats: (userId: string) => `/analytics/users/${userId}`,
  },
} as const;
