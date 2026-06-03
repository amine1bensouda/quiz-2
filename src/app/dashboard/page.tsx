'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getQuizStats, logout, type User } from '@/lib/auth-client';
import { excerptFromHtml } from '@/lib/utils';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  moduleCount: number;
  totalQuizzes: number;
}

interface SubscriptionInfo {
  id: string;
  plan: 'SINGLE_COURSE' | 'ALL_ACCESS' | string;
  status: string;
  provider: 'stripe' | 'paypal' | string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  course: { id: string; title: string; slug: string } | null;
}

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due']);

type NavKey =
  | 'dashboard'
  | 'exams'
  | 'practice'
  | 'analytics'
  | 'notifications'
  | 'profile'
  | 'resources';

const DASHBOARD_HASH_KEYS: Record<string, NavKey> = {
  exams: 'exams',
  analytics: 'analytics',
  notifications: 'notifications',
  profile: 'profile',
};

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
}

const ICON: Record<NavKey, ReactNode> = {
  dashboard: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  exams: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  practice: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  analytics: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-7" />
    </svg>
  ),
  notifications: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  profile: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  resources: (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4H10v16H4.5A2.5 2.5 0 0 1 2 17.5v-11z" />
      <path d="M22 6.5A2.5 2.5 0 0 0 19.5 4H14v16h5.5a2.5 2.5 0 0 0 2.5-2.5v-11z" />
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: ICON.dashboard },
  { key: 'exams', label: 'Exams', href: '/dashboard#exams', icon: ICON.exams },
  { key: 'practice', label: 'Practice', href: '/quiz', icon: ICON.practice },
  { key: 'analytics', label: 'Analytics', href: '/dashboard#analytics', icon: ICON.analytics },
  { key: 'notifications', label: 'Notifications', href: '/dashboard#notifications', icon: ICON.notifications },
  { key: 'profile', label: 'Profile', href: '/dashboard#profile', icon: ICON.profile },
  { key: 'resources', label: 'Resources', href: '/blogs', icon: ICON.resources },
];

function resolveActiveNavKey(pathname: string, hash: string): NavKey {
  if (pathname === '/quiz' || pathname.startsWith('/quiz/')) return 'practice';
  if (pathname === '/blogs' || pathname.startsWith('/blogs/')) return 'resources';
  if (pathname !== '/dashboard') return 'dashboard';

  const section = hash.replace('#', '');
  if (section && DASHBOARD_HASH_KEYS[section]) {
    return DASHBOARD_HASH_KEYS[section];
  }
  return 'dashboard';
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeNavKey, setActiveNavKey] = useState<NavKey>('dashboard');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function loadUserAndStats() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        const [userStats, subRes] = await Promise.all([
          getQuizStats(),
          fetch('/api/users/me/subscription', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : { subscription: null }))
            .catch(() => ({ subscription: null })),
        ]);
        setStats(userStats);
        setSubscription(subRes.subscription || null);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadUserAndStats();
  }, [router]);

  useEffect(() => {
    if (loading || !user) return;

    let isMounted = true;

    async function loadCourses() {
      setCoursesLoading(true);
      try {
        const response = await fetch('/api/courses', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }

        const data: Course[] = await response.json();
        if (isMounted) {
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading dashboard exams:', error);
        if (isMounted) {
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setCoursesLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [loading, user]);

  const scrollToSection = useCallback((hash: string) => {
    if (typeof window === 'undefined') return;
    const id = hash.replace('#', '');
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (loading) return;

    const syncNav = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      setActiveNavKey(resolveActiveNavKey(pathname, hash));
    };

    syncNav();
    window.addEventListener('hashchange', syncNav);
    return () => window.removeEventListener('hashchange', syncNav);
  }, [loading, pathname]);

  useEffect(() => {
    if (loading || coursesLoading) return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToSection(hash), 80);
    return () => window.clearTimeout(timer);
  }, [loading, coursesLoading, scrollToSection]);

  const examTotals = useMemo(() => {
    const totalQuizzes = courses.reduce((sum, c) => sum + (c.totalQuizzes || 0), 0);
    const totalModules = courses.reduce((sum, c) => sum + (c.moduleCount || 0), 0);
    return { totalQuizzes, totalModules, examBanks: courses.length };
  }, [courses]);

  const isPremium = useMemo(
    () => !!subscription && ACTIVE_STATUSES.has(subscription.status),
    [subscription]
  );

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="dash-app flex min-h-screen items-center justify-center">
        <div className="dash-stat-card flex flex-col items-center gap-6 rounded-3xl border p-10 sm:p-14">
          <LoadingSpinner size="lg" />
          <div className="mt-2 w-full space-y-3">
            <div className="mx-auto h-4 w-48 animate-pulse rounded-full bg-white/10" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const firstName = user.name?.split(' ')[0] ?? 'there';
  const totalAttempts: number = stats.totalAttempts ?? 0;
  const averageScore: number = stats.averageScore ?? 0;

  return (
    <div className="dash-app flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={handleLogout}
        activeKey={activeNavKey}
        onNavClick={(item) => {
          if (item.href.startsWith('/dashboard#')) {
            const hash = item.href.slice('/dashboard'.length);
            setActiveNavKey(item.key);
            window.history.pushState(null, '', item.href);
            scrollToSection(hash);
          } else if (item.href === '/dashboard') {
            setActiveNavKey('dashboard');
            window.history.pushState(null, '', '/dashboard');
            scrollToSection('');
          } else {
            setActiveNavKey(item.key);
          }
        }}
      />

      <main
        className="flex-1 px-4 py-6 transition-[margin] duration-200 md:px-8 md:py-7"
        style={{ marginLeft: collapsed ? '72px' : '240px' }}
      >
        <div id="dashboard" className="scroll-mt-6">
          <WelcomeHero
            name={firstName}
            isPremium={isPremium}
            startHref="/dashboard#exams"
            upgradeHref="/subscribe"
          />
        </div>

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="SUPERSCORE" value="--" accent="#f5c14a">
            <Sparkline color="#f5c14a" />
          </StatCard>
          <StatCard label="BEST SCORE" value="--" accent="#60c8ff">
            <div className="dash-muted flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60c8ff]" /> R&amp;W
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f7e]" /> Math
              </span>
            </div>
          </StatCard>
          <StatCard label="TESTS TAKEN" value={String(totalAttempts)} accent="#2be4c8">
            <ProgressDots filled={Math.min(totalAttempts, 6)} total={6} />
          </StatCard>
          <StatCard
            label="AVG SCORE"
            value={averageScore > 0 ? `${averageScore}%` : '--'}
            accent="#b388ff"
          >
            <div className="dash-progress-track h-1 w-full rounded-full">
              <div
                className="h-full rounded-full bg-[#b388ff]/70"
                style={{ width: `${Math.min(averageScore, 100)}%` }}
              />
            </div>
          </StatCard>
        </section>

        <ExamsSection
          courses={courses}
          loading={coursesLoading}
          totalQuizzes={examTotals.totalQuizzes}
          totalModules={examTotals.totalModules}
          examBanks={examTotals.examBanks}
        />

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            accent="#2be4c8"
            tag="BOOST YOUR SCORE"
            title="Practice Tests"
            description={
              <>
                Take <strong className="dash-strong font-semibold">full-length simulated exams</strong>{' '}
                under timed conditions to see where you stand.
              </>
            }
            cta="Start Now"
            href="/quiz"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M8 13h8M8 17h6" />
              </svg>
            }
          />
          <ActionCard
            accent="#60c8ff"
            tag="PREMIUM ONLY"
            title="Practice by Topic"
            description={
              <>
                Master concepts <strong className="dash-strong font-semibold">3x faster</strong> by
                targeting your specific weaknesses.
              </>
            }
            cta="Target Weakness"
            href={isPremium ? '/quiz' : '/subscribe'}
            locked={!isPremium}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            }
          />
          <ActionCard
            accent="#f5c14a"
            tag="FIX MISTAKES"
            title="Review Work"
            description={
              <>
                Don&apos;t lose points twice. Reviewing mistakes is the{' '}
                <strong className="dash-strong font-semibold">#1 way</strong> to improve.
              </>
            }
            cta="Learn"
            href="/dashboard#analytics"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />
          <ActionCard
            accent="#b388ff"
            tag="AI INSIGHTS"
            title="Analytics"
            description={
              <>
                Identify your{' '}
                <strong className="dash-strong font-semibold">hidden blind spots</strong> and see
                exactly where to focus next.
              </>
            }
            cta="View Data"
            href="/dashboard#analytics"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <rect x="3" y="12" width="4" height="8" rx="1" />
                <rect x="10" y="7" width="4" height="13" rx="1" />
                <rect x="17" y="3" width="4" height="17" rx="1" />
              </svg>
            }
          />
        </section>

        <AnalyticsSection stats={stats} />
        <NotificationsSection />
        <ProfileSection user={user} subscription={subscription} isPremium={isPremium} />

        <section className="flex flex-wrap gap-3">
          <Link
            href="/blogs"
            className="dash-pill inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Free Study Resources
          </Link>
          <Link
            href="/dashboard#profile"
            className="dash-pill inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
            Profile
          </Link>
        </section>
      </main>
    </div>
  );
}

function ExamsSection({
  courses,
  loading,
  totalQuizzes,
  totalModules,
  examBanks,
}: {
  courses: Course[];
  loading: boolean;
  totalQuizzes: number;
  totalModules: number;
  examBanks: number;
}) {
  return (
    <section id="exams" className="mb-8 scroll-mt-6">
      <div className="mb-6 text-center">
        <h2
          className="dash-exams-title mb-4"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            lineHeight: 1.1,
          }}
        >
          All Exams
        </h2>
        {!loading && (
          <p className="dash-exams-note dash-muted mx-auto max-w-3xl rounded-2xl border px-5 py-4 text-base md:text-lg">
            {totalQuizzes} exam{totalQuizzes !== 1 ? 's' : ''} available to test your knowledge and
            improve your mathematics skills
          </p>
        )}
      </div>

      {!loading && examBanks > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="dash-exam-stat rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-[#f5c14a]">{examBanks}</p>
            <p className="dash-muted text-xs uppercase tracking-wider">Exam banks</p>
          </div>
          <div className="dash-exam-stat rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-[#b388ff]">{totalQuizzes}</p>
            <p className="dash-muted text-xs uppercase tracking-wider">Total exams</p>
          </div>
          <div className="dash-exam-stat rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-[#2be4c8]">{totalModules}</p>
            <p className="dash-muted text-xs uppercase tracking-wider">Modules</p>
          </div>
          <div className="dash-exam-stat rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-[#ff5f7e]">48h</p>
            <p className="dash-muted text-xs uppercase tracking-wider">Free trial</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <DashboardExamCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="dash-exam-stat rounded-2xl border px-6 py-12 text-center">
          <p className="dash-muted">No exam banks published yet.</p>
        </div>
      )}
    </section>
  );
}

function DashboardExamCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/quiz/course/${course.slug}`}
      className="dash-exam-card group block rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="dash-exam-card-title text-lg font-bold leading-snug">{course.title}</h3>
        <svg
          className="h-5 w-5 shrink-0 text-[#f5c14a] opacity-0 transition-opacity group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {course.description && (
        <p className="dash-muted mb-5 line-clamp-3 text-sm leading-relaxed">
          {excerptFromHtml(course.description, 220)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="dash-exam-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5">
          <svg className="h-4 w-4 text-[#b388ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          {course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}
        </span>
        <span className="dash-exam-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5">
          <svg className="h-4 w-4 text-[#2be4c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {course.totalQuizzes} exam{course.totalQuizzes !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}

function DashboardPanel({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-8 scroll-mt-6">
      <div className="mb-5">
        <h2
          className="dash-exams-title mb-2"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        {subtitle && <p className="dash-muted text-sm md:text-base">{subtitle}</p>}
      </div>
      <div className="dash-exam-stat rounded-2xl border p-6">{children}</div>
    </section>
  );
}

function AnalyticsSection({ stats }: { stats: { totalAttempts: number; averageScore: number; passedQuizzes: number; totalTimeSpent: number; attempts: Array<{ quizTitle: string; percentage: number; completedAt: string }> } }) {
  const attempts = stats.attempts ?? [];
  return (
    <DashboardPanel
      id="analytics"
      title="Analytics"
      subtitle="Track your progress and recent quiz performance."
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold text-[#2be4c8]">{stats.totalAttempts}</p>
          <p className="dash-muted text-xs uppercase tracking-wider">Tests taken</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold text-[#b388ff]">
            {stats.averageScore > 0 ? `${stats.averageScore}%` : '--'}
          </p>
          <p className="dash-muted text-xs uppercase tracking-wider">Avg score</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold text-[#f5c14a]">{stats.passedQuizzes}</p>
          <p className="dash-muted text-xs uppercase tracking-wider">Passed (70%+)</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-2xl font-bold text-[#60c8ff]">
            {stats.totalTimeSpent > 0 ? `${Math.round(stats.totalTimeSpent / 60)}m` : '--'}
          </p>
          <p className="dash-muted text-xs uppercase tracking-wider">Time spent</p>
        </div>
      </div>
      {attempts.length > 0 ? (
        <ul className="space-y-3">
          {attempts.slice(0, 8).map((attempt, index) => (
            <li
              key={`${attempt.quizTitle}-${attempt.completedAt}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <span className="font-medium">{attempt.quizTitle}</span>
              <span className="text-sm text-[#b388ff]">{attempt.percentage}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dash-muted text-center">Complete a practice test to see your analytics here.</p>
      )}
    </DashboardPanel>
  );
}

function NotificationsSection() {
  return (
    <DashboardPanel
      id="notifications"
      title="Notifications"
      subtitle="Stay updated on your progress and account activity."
    >
      <p className="dash-muted text-center py-4">You&apos;re all caught up — no new notifications.</p>
    </DashboardPanel>
  );
}

function ProfileSection({
  user,
  subscription,
  isPremium,
}: {
  user: User;
  subscription: SubscriptionInfo | null;
  isPremium: boolean;
}) {
  return (
    <DashboardPanel id="profile" title="Profile" subtitle="Your account details and subscription status.">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <dt className="dash-muted text-xs uppercase tracking-wider">Name</dt>
          <dd className="mt-1 font-semibold">{user.name}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <dt className="dash-muted text-xs uppercase tracking-wider">Email</dt>
          <dd className="mt-1 font-semibold">{user.email}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <dt className="dash-muted text-xs uppercase tracking-wider">Plan</dt>
          <dd className="mt-1 font-semibold">{isPremium ? 'Premium' : 'Free'}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <dt className="dash-muted text-xs uppercase tracking-wider">Member since</dt>
          <dd className="mt-1 font-semibold">
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </dd>
        </div>
      </dl>
      {subscription?.course && (
        <p className="dash-muted mt-4 text-sm">
          Active course: <span className="text-[#f5c14a]">{subscription.course.title}</span>
        </p>
      )}
      {!isPremium && (
        <Link
          href="/subscribe"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0c0a00] transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(180deg, #f5c14a 0%, #e0a82e 100%)',
          }}
        >
          Unlock Premium
        </Link>
      )}
    </DashboardPanel>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  onLogout,
  activeKey,
  onNavClick,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  activeKey: NavKey;
  onNavClick?: (item: NavItem) => void;
}) {
  return (
    <aside
      className="dash-sidebar fixed inset-y-0 left-0 z-40 flex flex-col gap-1.5 border-r p-4 transition-[width] duration-200"
      style={{ width: collapsed ? '72px' : '240px' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="dash-sidebar-btn inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors"
        >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4 transition-transform"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => onNavClick?.(item)}
              className={`dash-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.92rem] font-medium transition-colors ${
                isActive ? 'dash-nav-link-active' : ''
              }`}
            >
              <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        title={collapsed ? 'Log Out' : undefined}
        className="mt-2 inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.92rem] font-medium text-[#ff6b7a] transition-colors hover:bg-[#ff6b7a]/10"
      >
        <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        {!collapsed && <span>Log Out</span>}
      </button>
    </aside>
  );
}

function WelcomeHero({
  name,
  isPremium,
  startHref,
  upgradeHref,
}: {
  name: string;
  isPremium: boolean;
  startHref: string;
  upgradeHref: string;
}) {
  return (
    <section className="dash-hero relative mb-5 flex items-center justify-between gap-6 overflow-hidden rounded-3xl border px-6 py-7 md:px-9 md:py-8">
      <div className="relative z-10 max-w-[540px]">
        <span
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider ${
            isPremium ? 'dash-plan-badge-premium' : 'dash-plan-badge'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isPremium ? 'Premium Plan' : 'Free Plan'}
        </span>
        <h1
          className="dash-hero-title mb-2.5"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          Welcome, <span className="text-[#f5c14a]">{name}</span>
        </h1>
        <p className="dash-muted mb-6 text-[0.95rem]">Ready for your next milestone?</p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={startHref}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0c0a00] transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(180deg, #f5c14a 0%, #e0a82e 100%)',
              boxShadow: '0 6px 20px rgba(245, 193, 74, 0.24)',
            }}
          >
            Start a Practice Test
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          {!isPremium && (
            <Link
              href={upgradeHref}
              className="dash-btn-secondary inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M12 2L4 8v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V8l-8-6z" />
              </svg>
              Unlock Premium
            </Link>
          )}
        </div>
      </div>

      <div className="relative z-0 hidden w-[320px] max-w-[38%] shrink-0 md:block" aria-hidden="true">
        <BooksIllustration />
      </div>
    </section>
  );
}

function BooksIllustration() {
  return (
    <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5c14a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f5c14a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="150" rx="150" ry="22" fill="url(#glow)" opacity="0.7" />
      <rect x="40" y="135" width="240" height="6" rx="1" fill="#f5c14a" />
      <rect x="60" y="141" width="10" height="10" fill="#b08a2c" />
      <rect x="250" y="141" width="10" height="10" fill="#b08a2c" />
      <rect x="120" y="50" width="80" height="85" fill="#3a3a52" />
      <rect x="120" y="50" width="80" height="10" fill="#2a2a40" />
      <rect x="125" y="65" width="70" height="3" fill="rgba(255,255,255,0.18)" />
      <rect x="98" y="72" width="22" height="63" fill="#7a3a3a" />
      <rect x="200" y="72" width="22" height="63" fill="#3a5a7a" />
      <rect x="78" y="92" width="20" height="43" fill="#6a5a3a" />
      <rect x="222" y="92" width="20" height="43" fill="#5a3a6a" />
      <rect x="146" y="32" width="28" height="20" fill="#f5c14a" />
      <rect x="146" y="32" width="28" height="3" fill="#e0a82e" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="dash-stat-card flex min-h-[130px] flex-col gap-2 rounded-2xl border px-5 py-4"
    >
      <div className="inline-flex items-center gap-2">
        <span
          className="h-3.5 w-3.5 rounded opacity-60"
          style={{ background: accent }}
        />
        <span className="dash-muted text-[0.7rem] font-semibold tracking-[0.12em]">{label}</span>
      </div>
      <div
        className="dash-stat-value"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.4rem',
          lineHeight: 1,
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 30" preserveAspectRatio="none" className="h-6 w-full">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.7"
        points="0,22 25,20 50,17 75,18 100,14 125,12 150,10 175,9 200,6"
      />
    </svg>
  );
}

function ProgressDots({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < filled ? '' : 'dash-progress-empty'}`}
          style={i < filled ? { background: '#2be4c8' } : undefined}
        />
      ))}
    </div>
  );
}

function ActionCard({
  accent,
  tag,
  title,
  description,
  cta,
  href,
  icon,
  locked = false,
}: {
  accent: string;
  tag: string;
  title: string;
  description: ReactNode;
  cta: string;
  href: string;
  icon: ReactNode;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className="dash-action-card group relative flex min-h-[200px] flex-col gap-2.5 overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}55`;
        e.currentTarget.style.boxShadow = `0 14px 36px ${accent}1f`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        className="pointer-events-none absolute -bottom-[60%] -right-[40%] h-60 w-60 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${accent}22, transparent 70%)` }}
        aria-hidden="true"
      />
      <div
        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border"
        style={{
          color: accent,
          background: `${accent}15`,
          borderColor: `${accent}33`,
        }}
      >
        {icon}
      </div>
      <h3 className="dash-action-title mt-1 text-[1.05rem] font-bold">{title}</h3>
      <p className="dash-muted text-[0.86rem] leading-[1.55]">{description}</p>
      <div className="dash-action-foot mt-auto flex items-center justify-between border-t pt-2.5">
        <span
          className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {locked && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {tag}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold"
          style={{ color: accent }}
        >
          {cta}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
