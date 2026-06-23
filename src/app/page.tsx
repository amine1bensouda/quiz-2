import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_DESCRIPTION } from '@/lib/constants';
import { getAllPublishedCourses } from '@/lib/course-service';
import {
  PLANS,
  formatPlanPrice,
  formatPlanPriceAmount,
  formatPlanPriceMo,
} from '@/lib/plans';
import { formatNumber } from '@/lib/utils';
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
  const withTimeout = async <T,>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> => {
    const safePromise = promise.catch(() => fallback);
    return Promise.race([
      safePromise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  };

  const publishedCourses = await withTimeout(getAllPublishedCourses(), []);

  const singleCoursePlan = PLANS.SINGLE_COURSE;
  const monthlyPrice = formatPlanPriceAmount(singleCoursePlan);
  const pricePerExam = `${formatPlanPriceAmount(singleCoursePlan)} per exam / month`;

  const marqueeItems = [
    ...publishedCourses.map((course) => `${course.title} QBank`),
    pricePerExam,
    '48-hour free trial',
    'Cancel anytime',
  ];

  return (
      <main className="ctc-home">
        <section className="hero">
          <div className="orb orb-amber" />
          <div className="orb orb-rose" />
          <div className="orb orb-teal" />
          <div className="hero-badge">48-hour free trial</div>
          <h1 className="hero-h1">Every student deserves to <em>crack</em> their exam.</h1>

          <div className="hero-highlights" aria-label="Pricing highlights">
            <div className="hero-highlight hero-highlight--price">
              <span className="hero-highlight-icon" aria-hidden="true">$</span>
              <div className="hero-highlight-body">
                <div className="hero-highlight-val">
                  <span className="hero-highlight-number">{monthlyPrice}</span>
                  <span className="hero-highlight-unit">/mo</span>
                </div>
                <p className="hero-highlight-label">Per QBank</p>
                <p className="hero-highlight-note">Cancel anytime</p>
              </div>
            </div>
            <div className="hero-highlight hero-highlight--trial">
              <span className="hero-highlight-icon" aria-hidden="true">⏱</span>
              <div className="hero-highlight-body">
                <div className="hero-highlight-val">
                  <span className="hero-highlight-number">48</span>
                  <span className="hero-highlight-unit">h</span>
                </div>
                <p className="hero-highlight-label">Free trial</p>
                <p className="hero-highlight-note">No charge before billing</p>
              </div>
            </div>
          </div>

          <div className="actions">
            <Link href="/quiz" className="btn-hero">
              Browse QBanks
              <span className="btn-hero-arrow" aria-hidden="true">→</span>
            </Link>
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
                <div className="pillar">Fair pricing<br /><span className="muted">{formatPlanPrice(singleCoursePlan)}</span></div>
                <div className="pillar">Real analytics<br /><span className="muted">Track every weak spot.</span></div>
                <div className="pillar">Targeted drills<br /><span className="muted">Focus on what matters.</span></div>
                <div className="pillar">Instant access<br /><span className="muted">Start in 60 seconds.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="qbanks">
          <h2 className="section-title">Pick your exam. Start <em>today.</em></h2>
          <p className="section-desc">Each QBank includes full-length timed tests, topic drills, detailed answer explanations, and a personal performance dashboard. {formatPlanPrice(singleCoursePlan)} per course with a 48h free trial.</p>
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
                    <div className="price" style={{ color: theme.accent }}>{formatPlanPriceMo(singleCoursePlan)}</div>
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
