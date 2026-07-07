import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Извлекаем cookie индикации логина
  const loggedInCookie = request.cookies.get('learnhub_logged_in');
  const roleCookie = request.cookies.get('learnhub_role');

  const isLoggedIn = loggedInCookie?.value === 'true';
  const role = roleCookie?.value;

  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Маршруты защищенных зон
  const isStudentRoute = pathname.startsWith('/student');
  const isAuthorRoute = pathname.startsWith('/author');
  const isAdminRoute = pathname.startsWith('/admin');

  const isProtectedRoute = isStudentRoute || isAuthorRoute || isAdminRoute;

  // 1. Если пользователь не вошел в систему, но пытается зайти на защищенные роуты
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Если пользователь вошел в систему, но пытается зайти на страницы логина/регистрации
  if (isAuthRoute && isLoggedIn && role) {
    if (role === 'STUDENT') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (role === 'TEACHER') {
      return NextResponse.redirect(new URL('/author/dashboard', request.url));
    }
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // 3. Защита ролей (перекрестный доступ)
  if (isLoggedIn && role) {
    if (role === 'STUDENT' && (isAuthorRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (role === 'TEACHER' && isAdminRoute) {
      return NextResponse.redirect(new URL('/author/dashboard', request.url));
    }
    if (role === 'TEACHER' && isStudentRoute) {
      // Преподаватели могут проходить курсы, поэтому разрешаем им доступ к студенческому разделу
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/student/:path*',
    '/author/:path*',
    '/admin/:path*',
  ],
};
