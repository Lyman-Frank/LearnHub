'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  Code,
  Brain,
  Trophy,
  Sun,
  Moon,
  Rocket,
  CheckCircle,
  Star,
  Zap,
  BarChart3,
  Layers,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   PARTICLES — pure CSS floating dots
   ───────────────────────────────────────────── */
const particles = [
  { size: 4, top: '10%', left: '15%', duration: '18s', delay: '0s' },
  { size: 6, top: '20%', left: '80%', duration: '22s', delay: '2s' },
  { size: 3, top: '55%', left: '10%', duration: '16s', delay: '4s' },
  { size: 5, top: '35%', left: '90%', duration: '20s', delay: '1s' },
  { size: 7, top: '70%', left: '25%', duration: '24s', delay: '3s' },
  { size: 4, top: '80%', left: '70%', duration: '19s', delay: '5s' },
  { size: 3, top: '45%', left: '50%', duration: '21s', delay: '2.5s' },
  { size: 5, top: '15%', left: '45%', duration: '17s', delay: '1.5s' },
];

/* ─────────────────────────────────────────────
   FEATURE DATA
   ───────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: 'Интерактивные квизы',
    description:
      'Тесты с одним и множественным выбором, вводом текста и мгновенной обратной связью.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Code,
    title: 'Песочница кода',
    description:
      'Пишите и тестируйте код прямо в браузере с подсветкой синтаксиса и авто-проверкой.',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    icon: Layers,
    title: 'Карточки запоминания',
    description:
      'Учите термины и концепции в интерактивном формате, вдохновлённом Duolingo.',
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  {
    icon: BarChart3,
    title: 'Аналитика прогресса',
    description:
      'Отслеживайте свои результаты в реальном времени с красивыми графиками и статистикой.',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    icon: Sparkles,
    title: 'Конструктор курсов',
    description:
      'Создавайте курсы с удобным drag-and-drop редактором. Модули, уроки, шаги — всё просто.',
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    icon: Trophy,
    title: 'Геймификация',
    description:
      'Достижения, уровни, очки опыта — учиться становится захватывающе и мотивирующе.',
    gradient: 'from-amber-500 to-orange-600',
  },
];

/* ─────────────────────────────────────────────
   STEPS DATA
   ───────────────────────────────────────────── */
const steps = [
  {
    number: '01',
    icon: Rocket,
    title: 'Регистрация',
    description: 'Создайте аккаунт за 30 секунд — бесплатно и без карты.',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Выбираете курс',
    description: 'Находите курс по интересам из каталога или по рекомендациям.',
  },
  {
    number: '03',
    icon: Star,
    title: 'Учитесь и растёте',
    description: 'Проходите уроки, решайте квизы и отслеживайте свой прогресс.',
  },
];

/* ─────────────────────────────────────────────
   STATS DATA
   ───────────────────────────────────────────── */
const stats = [
  { label: 'Курсов', value: '500+', icon: BookOpen },
  { label: 'Студентов', value: '10K+', icon: Users },
  { label: 'Довольных', value: '98%', icon: CheckCircle },
];

/* ═════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═════════════════════════════════════════════ */
export default function HomePage() {
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Load theme preference from localStorage on mount ── */
  useEffect(() => {
    const stored = localStorage.getItem('learnhub_theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  /* ── Dark mode toggle function ── */
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    const html = document.documentElement;
    if (newIsDark) {
      html.classList.add('dark');
      localStorage.setItem('learnhub_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('learnhub_theme', 'light');
    }
  };

  /* ── Scroll detection for navbar ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ─── NAVIGATION BAR ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass py-3 shadow-lg'
            : 'py-5 bg-transparent'
        }`}
      >
        <nav className="container-main flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" id="nav-logo">
            <GraduationCap
              className="w-8 h-8 text-violet-500 transition-transform duration-300 group-hover:rotate-12"
              strokeWidth={2}
            />
            <span className="text-xl font-bold gradient-text">LearnHub</span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-muted hover:text-violet-500 transition-colors duration-300"
              id="nav-courses"
            >
              Курсы
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted hover:text-violet-500 transition-colors duration-300"
              id="nav-about"
            >
              О платформе
            </a>
            <a
              href="#cta"
              className="text-sm font-medium text-muted hover:text-violet-500 transition-colors duration-300"
              id="nav-contacts"
            >
              Контакты
            </a>
          </div>

          {/* Right-side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl transition-all duration-300 hover:bg-violet-500/10 group"
              aria-label="Toggle dark mode"
              id="btn-theme-toggle"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-violet-600 group-hover:text-violet-700 transition-colors" />
              )}
            </button>

            <button className="btn-secondary text-sm py-2 px-5" id="btn-login">
              Войти
            </button>
            <button className="btn-primary text-sm py-2 px-5" id="btn-register">
              <Zap className="w-4 h-4" />
              Регистрация
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-violet-500/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="btn-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-violet-500" />
            ) : (
              <Menu className="w-6 h-6 text-violet-500" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-dark mt-2 mx-4 rounded-2xl p-6 slide-up">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-sm font-medium text-muted hover:text-violet-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Курсы
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted hover:text-violet-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                О платформе
              </a>
              <a
                href="#cta"
                className="text-sm font-medium text-muted hover:text-violet-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Контакты
              </a>
              <hr className="border-violet-500/20" />
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl hover:bg-violet-500/10 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-violet-600" />
                  )}
                </button>
              </div>
              <button className="btn-secondary text-sm w-full">Войти</button>
              <button className="btn-primary text-sm w-full">
                <Zap className="w-4 h-4" />
                Регистрация
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center justify-center animated-gradient-bg pt-24 pb-16">
        {/* Floating Particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              '--duration': p.duration,
              '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}

        {/* Decorative glow orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(217,70,239,0.35), transparent 70%)',
          }}
        />

        <div className="container-main relative z-10 text-center">
          {/* Badge */}
          <div className="slide-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-muted">Новый сезон курсов уже доступен</span>
          </div>

          {/* Heading */}
          <h1 className="slide-up-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="gradient-text">Учись. Создавай.</span>
            <br />
            <span className="gradient-text">Прогрессируй.</span>
          </h1>

          {/* Sub-heading */}
          <p className="slide-up-delay-2 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted mb-10 leading-relaxed">
            Интерактивная платформа для создания и прохождения онлайн-курсов,
            квизов и микро-уроков. Учитесь в своём темпе, отслеживайте прогресс
            и достигайте целей.
          </p>

          {/* CTA Buttons */}
          <div className="slide-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="btn-primary text-base py-3.5 px-8" id="btn-hero-start">
              Начать обучение
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="btn-secondary text-base py-3.5 px-8" id="btn-hero-author">
              <Rocket className="w-5 h-5" />
              Стать автором
            </button>
          </div>

          {/* Stats Row */}
          <div className="slide-up-delay-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-3 group"
              >
                <div className="p-2.5 rounded-xl glass group-hover:shadow-lg transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-violet-500" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="py-24 relative">
        {/* Subtle background decoration */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)',
          }}
        />

        <div className="container-main relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm font-medium">
              <Zap className="w-4 h-4 text-violet-500" />
              <span className="text-muted">Возможности</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              <span className="gradient-text">Почему LearnHub?</span>
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">
              Всё что нужно для эффективного обучения — в одном месте
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card group cursor-default"
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {/* Icon */}
                <div className="mb-5 inline-flex p-3.5 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-violet-500 group-hover:text-violet-400 transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2 transition-colors duration-300 group-hover:text-violet-500">
                  {feature.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section id="how-it-works" className="py-24 relative">
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(217,70,239,0.3), transparent 70%)',
          }}
        />

        <div className="container-main relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-muted">Просто как 1-2-3</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              <span className="gradient-text">Как это работает</span>
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">
              Начните учиться за три простых шага
            </p>
          </div>

          {/* Steps */}
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting Line — Desktop */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[2px] -translate-y-1/2 bg-gradient-to-r from-violet-500/20 via-violet-500/40 to-violet-500/20 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {steps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  {/* Connecting Line — Mobile (vertical) */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden absolute top-full left-1/2 w-[2px] h-8 -translate-x-1/2 bg-gradient-to-b from-violet-500/40 to-transparent" />
                  )}

                  {/* Number Badge */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center group-hover:shadow-lg transition-all duration-500 neon-border">
                      <step.icon className="w-8 h-8 text-violet-500 group-hover:text-violet-400 transition-colors duration-300" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-violet-500 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section id="cta" className="py-24">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl p-[1px]">
            {/* Gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-70 rounded-3xl" />

            {/* Inner content */}
            <div className="relative glass-dark rounded-3xl py-16 px-8 sm:px-12 md:px-20 text-center">
              {/* Decorative glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse, rgba(139,92,246,0.5), transparent 70%)',
                }}
              />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 text-sm font-medium text-violet-300">
                  <Rocket className="w-4 h-4" />
                  Бесплатный старт
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white">
                  Готовы начать обучение?
                </h2>
                <p className="text-violet-200/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
                  Присоединяйтесь к тысячам студентов уже сегодня. Создайте
                  аккаунт и откройте доступ к сотням интерактивных курсов.
                </p>

                <button className="btn-primary text-base py-4 px-10" id="btn-cta-register">
                  Создать аккаунт бесплатно
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-violet-500/10">
        <div className="container-main">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-violet-500" />
              <span className="text-lg font-bold gradient-text">LearnHub</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted">
              <a
                href="#features"
                className="hover:text-violet-500 transition-colors duration-300"
              >
                Курсы
              </a>
              <a
                href="#how-it-works"
                className="hover:text-violet-500 transition-colors duration-300"
              >
                О платформе
              </a>
              <a
                href="#cta"
                className="hover:text-violet-500 transition-colors duration-300"
              >
                Контакты
              </a>
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-sm text-muted">
                &copy; {new Date().getFullYear()} LearnHub. Все права защищены.
              </p>
              <p className="text-xs text-muted">
                Made with 💜 for learners
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
