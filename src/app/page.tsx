import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_DESCRIPTION } from '@/lib/constants';
import { getStats } from '@/lib/wordpress';
import { getAllPublishedCourses } from '@/lib/course-service';
import { getFeaturedQuiz } from '@/lib/quiz-service';
import { formatNumber } from '@/lib/utils';
import { getCurrentUserFromSession } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Home',
  description: SITE_DESCRIPTION,
};

export const revalidate = 3600;

const CARD_THEMES = [
  { accent: 'var(--amber)', className: 'amber' },
  { accent: 'var(--rose)', className: 'rose' },
  { accent: 'var(--violet)', className: 'violet' },
  { accent: 'var(--teal)', className: 'teal' },
  { accent: 'var(--sky)', className: 'sky' },
];

export default async function HomePage() {
  const defaultStats = {
    total_quiz: 0,
    total_questions: 0,
    total_categories: 0,
    quiz_par_categorie: {},
  };

  const withTimeout = async <T,>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> => {
    // Keep the homepage resilient if APIs/DB fail or respond slowly.
    const safePromise = promise.catch(() => fallback);
    return Promise.race([
      safePromise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  };

  const [stats, publishedCourses, featuredQuiz, currentUser] = await Promise.all([
    withTimeout(getStats(), defaultStats),
    withTimeout(getAllPublishedCourses(), []),
    withTimeout(getFeaturedQuiz(), []),
    getCurrentUserFromSession(),
  ]);

  const trialOrSignupHref = currentUser ? '/dashboard' : '/register';

  const questionsFromFeatured = featuredQuiz.reduce(
    (sum, quiz) => sum + (quiz.acf?.nombre_questions ?? 0),
    0
  );
  const totalQuestions = stats.total_questions > 0 ? stats.total_questions : questionsFromFeatured;
  const examBanks = publishedCourses.length;
  const monthlyPrice = 7;
  const allAccessPrice = 25;

  const marqueeItems = [
    ...publishedCourses.map((course) => `${course.title} QBank`),
    '$7 per exam / month',
    '48-hour free trial',
    'Cancel anytime',
  ];

  return (
      <main className="ctc-home">
        <section className="hero">
          <div className="orb orb-amber" />
          <div className="orb orb-rose" />
          <div className="orb orb-teal" />
          <div className="hero-badge">48-hour free trial · No credit card required</div>
          <h1 className="hero-h1">Every student deserves to <em>crack</em> their exam.</h1>
          <p className="hero-sub">$7/month for this course alone, or <strong>$25/month</strong> for all courses. 48h free trial — no charge before billing.</p>
          <div className="actions">
            <Link href={trialOrSignupHref} className="btn-primary">Start free trial</Link>
            <Link href="/quiz" className="btn-secondary">Browse QBanks</Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat"><div className="hstat-val" style={{ color: 'var(--amber)' }}>{formatNumber(examBanks)}</div><div className="hstat-label">Exam banks</div></div>
            <div className="hero-stat"><div className="hstat-val" style={{ color: 'var(--teal)' }}>${monthlyPrice}</div><div className="hstat-label">Per QBank / month</div></div>
            <div className="hero-stat"><div className="hstat-val" style={{ color: 'var(--rose)' }}>48h</div><div className="hstat-label">Free trial</div></div>
            <div className="hero-stat"><div className="hstat-val">{formatNumber(totalQuestions)}</div><div className="hstat-label">Practice questions</div></div>
          </div>
        </section>

        <div className="strip">
          <div className="track">
            {marqueeItems.map((item, index) => (<span key={`mq-1-${index}`}>{item}</span>))}
            {marqueeItems.map((item, index) => (<span key={`mq-2-${index}`}>{item}</span>))}
          </div>
        </div>

        <section className="mission">
          <div className="mission-inner">
            <div className="mission-quote">
              Practice is a <em style={{ color: 'var(--amber)' }}>right</em>, not a privilege.
            </div>
            <div>
              <p className="section-desc">Test prep has always been pay-to-win. We built Crack the Curve to make serious exam prep affordable for every student.</p>
              <div className="mission-pillars">
                <div className="pillar">Fair pricing<br /><span className="muted">$7/month — not $70.</span></div>
                <div className="pillar">Real analytics<br /><span className="muted">Track every weak spot.</span></div>
                <div className="pillar">Targeted drills<br /><span className="muted">Focus on what matters.</span></div>
                <div className="pillar">Instant access<br /><span className="muted">Start in 60 seconds.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="qbanks">
          <h2 className="section-title">Pick your exam. Start <em>today.</em></h2>
          <p className="section-desc">Each QBank includes full-length timed tests, topic drills, detailed answer explanations, and a personal performance dashboard. $7/month for one course, or $25/month for all courses with a 48h free trial.</p>
          <div className="qbank-grid">
            {publishedCourses.length > 0 ? (
              publishedCourses.map((course, index) => {
                const theme = CARD_THEMES[index % CARD_THEMES.length];
                const totalQuizzes = course.modules?.reduce((sum, module) => sum + (module._count?.quizzes ?? 0), 0) ?? 0;
                const moduleCount = course._count?.modules ?? course.modules?.length ?? 0;
                const targetUrl = course.slug ? `/quiz/course/${course.slug}` : '/quiz';

                return (
                  <article className="qcard" key={course.id}>
                    <h3 className="qname" style={{ color: theme.accent }}>{course.title}</h3>
                    <p className="muted">
                      {formatNumber(totalQuizzes)} quiz · {formatNumber(moduleCount)} module{moduleCount > 1 ? 's' : ''}
                    </p>
                    <div className="price" style={{ color: theme.accent }}>$7/mo</div>
                    <Link className="card-btn" href={targetUrl}>Try free</Link>
                  </article>
                );
              })
            ) : (
              <article className="qcard">
                <h3 className="qname" style={{ color: 'var(--amber)' }}>No QBank yet</h3>
                <p className="muted">Publish your first course to populate this section automatically.</p>
                <div className="price" style={{ color: 'var(--amber)' }}>--</div>
                <Link className="card-btn" href="/quiz">Browse quizzes</Link>
              </article>
            )}
          </div>
        </section>

        <section className="bundle">
          <div>
            <p className="muted">All Access · Best Value</p>
            <h2 className="section-title">Every QBank. One <em>flat price.</em></h2>
            <p className="section-desc">Unlock all {formatNumber(examBanks)} exam banks for one monthly plan.</p>
          </div>
          <div>
            <p className="muted">$7/month for this course alone</p>
            <div className="price" style={{ color: 'var(--amber)', fontSize: '4rem' }}>${allAccessPrice}/mo</div>
            <Link href={trialOrSignupHref} className="btn-primary">Get All Access</Link>
          </div>
        </section>

        <section className="section" id="how">
          <h2 className="section-title">Four steps to your <em>best score.</em></h2>
          <div className="steps">
            <div className="step"><div className="step-n">01</div><h3>Choose your exam bank</h3><p className="section-desc">Start with your target exam and activate your free trial.</p></div>
            <div className="step"><div className="step-n">02</div><h3>Practice at your own pace</h3><p className="section-desc">Use drills, mocks, and adaptive quizzes.</p></div>
            <div className="step"><div className="step-n">03</div><h3>Track your progress</h3><p className="section-desc">Analyze weak spots and revisit missed concepts.</p></div>
            <div className="step"><div className="step-n">04</div><h3>Walk in confident</h3><p className="section-desc">Build speed and reduce exam-day stress.</p></div>
          </div>
        </section>
      </main>
  );
}
