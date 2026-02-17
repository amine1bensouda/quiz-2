/**
 * Données des articles de blog — partagées entre liste et détail.
 * Contient des articles orientés SEO et liés aux quiz/cours (gratuits).
 */

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  slug: string;
  /** Lien CTA vers quiz/cours (ex: /quiz, /quiz/course/act-math) */
  ctaLink?: string;
  /** Texte du bouton CTA (ex: "Practice ACT Math", "Try free quizzes") */
  ctaText?: string;
  /** Mots-clés SEO */
  tags?: string[];
}

const posts: BlogPost[] = [
  {
    id: 1,
    slug: '10-tips-master-algebra',
    title: '10 Tips to Master Algebra',
    excerpt: 'Discover effective strategies to improve your algebra skills and build confidence in solving equations.',
    date: '2024-01-15',
    category: 'Learning Tips',
    tags: ['algebra', 'math tips', 'study skills', 'ACT math', 'SAT math'],
    ctaLink: '/quiz',
    ctaText: 'Practice algebra quizzes free',
    content: `
      <p>Algebra is one of the fundamental branches of mathematics, and mastering it opens doors to advanced mathematical concepts. Here are 10 proven tips to help you excel in algebra:</p>
      <h2>1. Understand the Basics</h2>
      <p>Before diving into complex equations, ensure you have a solid understanding of basic arithmetic operations, fractions, and decimals.</p>
      <h2>2. Practice Regularly</h2>
      <p>Consistent practice is key to mastering algebra. Set aside time each day to work on problems and reinforce your understanding.</p>
      <h2>3. Work Step by Step</h2>
      <p>Break down complex problems into smaller, manageable steps. This approach helps prevent errors and builds confidence.</p>
      <h2>4. Use Visual Aids</h2>
      <p>Graphs, charts, and diagrams can help you visualize algebraic concepts and understand relationships between variables.</p>
      <h2>5. Check Your Work</h2>
      <p>Always verify your solutions by substituting your answers back into the original equation.</p>
      <h2>6. Learn from Mistakes</h2>
      <p>Don't be discouraged by errors. Analyze your mistakes to understand where you went wrong and how to avoid similar issues in the future.</p>
      <h2>7. Seek Help When Needed</h2>
      <p>Don't hesitate to ask for help from teachers, tutors, or online resources when you're stuck on a concept.</p>
      <h2>8. Apply Algebra to Real Life</h2>
      <p>Connect algebraic concepts to real-world situations to make learning more meaningful and memorable.</p>
      <h2>9. Use Technology Wisely</h2>
      <p>Leverage calculators and educational apps as learning tools, but don't rely on them entirely. Understanding the process is crucial.</p>
      <h2>10. Stay Positive</h2>
      <p>Maintain a positive attitude and believe in your ability to learn. With dedication and practice, you can master algebra!</p>
    `,
  },
  {
    id: 2,
    slug: 'understanding-calculus-beginners-guide',
    title: 'Understanding Calculus: A Beginner\'s Guide',
    excerpt: 'A comprehensive introduction to calculus concepts, from limits to derivatives and integrals.',
    date: '2024-01-10',
    category: 'Mathematics',
    tags: ['calculus', 'math', 'AP calculus', 'study guide'],
    ctaLink: '/quiz',
    ctaText: 'Explore math quizzes',
    content: `
      <p>Calculus is a branch of mathematics that deals with rates of change and accumulation. This guide will introduce you to the fundamental concepts.</p>
      <h2>What is Calculus?</h2>
      <p>Calculus is divided into two main branches: differential calculus and integral calculus. Differential calculus focuses on rates of change, while integral calculus deals with accumulation.</p>
      <h2>Key Concepts</h2>
      <p>Understanding limits, derivatives, and integrals is essential for mastering calculus. These concepts form the foundation of advanced mathematical analysis.</p>
    `,
  },
  {
    id: 3,
    slug: 'how-to-prepare-math-competitions',
    title: 'How to Prepare for Math Competitions',
    excerpt: 'Expert advice on preparing for mathematics competitions and excelling in competitive problem-solving.',
    date: '2024-01-05',
    category: 'Competitions',
    tags: ['math competition', 'AMC', 'problem solving', 'practice'],
    ctaLink: '/quiz',
    ctaText: 'Practice with timed quizzes',
    content: `
      <p>Mathematics competitions require a unique set of skills and preparation strategies. Here's how to excel:</p>
      <h2>Preparation Strategies</h2>
      <p>Effective preparation involves regular practice, understanding problem-solving techniques, and developing time management skills.</p>
      <h2>Key Areas to Focus On</h2>
      <p>Focus on algebra, geometry, number theory, and combinatorics. These areas frequently appear in mathematics competitions.</p>
    `,
  },
  // ——— SEO & liens quiz/cours (gratuits) ———
  {
    id: 4,
    slug: 'free-act-math-practice-online',
    title: 'Free ACT Math Practice Online: Best Resources in 2024',
    excerpt: 'Where to find free ACT math practice questions and full-length tests. Get ready for test day with no-cost drills and courses.',
    date: '2024-02-01',
    category: 'Exam Prep',
    tags: ['ACT math', 'free practice', 'ACT prep', 'standardized test'],
    ctaLink: '/quiz',
    ctaText: 'Start free ACT math practice',
    content: `
      <p>Preparing for the ACT math section doesn't have to cost a fortune. This guide rounds up the best free ACT math practice you can use right now.</p>
      <h2>Why Free ACT Math Practice Works</h2>
      <p>Consistent practice with real-style questions improves speed and accuracy. Free resources let you drill without paying for expensive prep courses.</p>
      <h2>What to Look For</h2>
      <p>Choose materials that mirror the real ACT: algebra, geometry, statistics, and number operations. Timed practice builds the stamina you need on test day.</p>
      <h2>Practice Regularly</h2>
      <p>Set a schedule and stick to it. Even 15–20 minutes of daily practice can lead to significant score improvements over a few months.</p>
    `,
  },
  {
    id: 5,
    slug: 'sat-math-tips-score-higher',
    title: 'SAT Math Tips to Score Higher: What Really Works',
    excerpt: 'Evidence-based SAT math strategies: time management, question order, and how to avoid common mistakes.',
    date: '2024-02-05',
    category: 'Exam Prep',
    tags: ['SAT math', 'SAT tips', 'college prep', 'standardized test'],
    ctaLink: '/quiz',
    ctaText: 'Try free SAT-style quizzes',
    content: `
      <p>Improving your SAT math score is about strategy as much as content. Here are tips that actually move the needle.</p>
      <h2>Manage Your Time</h2>
      <p>Work through easier questions first to bank time for harder ones. Skip, mark, and return instead of getting stuck.</p>
      <h2>Know the Formula Sheet</h2>
      <p>The SAT gives you a reference sheet. Know it cold so you don't waste time searching during the test.</p>
      <h2>Practice Under Test Conditions</h2>
      <p>Use timed practice tests to build speed and reduce stress on test day. Free online quizzes are a great way to simulate the real thing.</p>
    `,
  },
  {
    id: 6,
    slug: 'best-free-math-quiz-websites-for-students',
    title: 'Best Free Math Quiz Websites for Students',
    excerpt: 'A roundup of free math quiz and practice sites for ACT, SAT, AP, and GCSE — no subscription required.',
    date: '2024-02-10',
    category: 'Learning Tips',
    tags: ['free math quizzes', 'online practice', 'ACT', 'SAT', 'students'],
    ctaLink: '/quiz',
    ctaText: 'Explore our free quizzes',
    content: `
      <p>Looking for free math practice that fits your exam? Here’s how to find quality quizzes and courses without paying a cent.</p>
      <h2>Why Use Free Quiz Sites</h2>
      <p>Free resources let you practice as much as you need, try different topics, and build confidence before test day.</p>
      <h2>What Makes a Good Math Quiz Site</h2>
      <p>Look for sites that offer timed quizzes, clear explanations, and coverage of algebra, geometry, and word problems similar to real exams.</p>
      <p>The School of Mathematics offers free practice for ACT, SAT, and more — no sign-up required to start.</p>
    `,
  },
  {
    id: 7,
    slug: 'how-to-improve-math-speed-accuracy',
    title: 'How to Improve Math Speed and Accuracy for Standardized Tests',
    excerpt: 'Practical techniques to work faster and more accurately on ACT, SAT, and other timed math sections.',
    date: '2024-02-12',
    category: 'Learning Tips',
    tags: ['math speed', 'test strategy', 'ACT', 'SAT', 'accuracy'],
    ctaLink: '/quiz',
    ctaText: 'Practice with timed quizzes',
    content: `
      <p>On timed math sections, speed and accuracy both matter. Here’s how to get better at both.</p>
      <h2>Build a Strong Foundation</h2>
      <p>Quick recall of basics (times tables, fractions, basic algebra) saves time. Drill until operations feel automatic.</p>
      <h2>Use Timed Practice</h2>
      <p>Regular timed quizzes train you to work under pressure and spot where you slow down. Aim for a pace that leaves time to review.</p>
      <h2>Review Every Mistake</h2>
      <p>After each practice set, review wrong answers. Fixing one type of error often improves your score more than grinding extra problems.</p>
    `,
  },
  {
    id: 8,
    slug: 'algebra-vs-geometry-which-to-study-first',
    title: 'Algebra vs Geometry: Which to Study First?',
    excerpt: 'A practical guide to the order of math topics for high school and standardized test prep.',
    date: '2024-02-15',
    category: 'Mathematics',
    tags: ['algebra', 'geometry', 'math order', 'study plan'],
    ctaLink: '/categorie',
    ctaText: 'Browse quiz categories',
    content: `
      <p>Students often ask whether to focus on algebra or geometry first. The short answer: it depends on your goals and gaps.</p>
      <h2>If Your Goal Is the ACT or SAT</h2>
      <p>Both tests mix algebra and geometry. A solid algebra base (equations, functions, word problems) usually helps more before diving deep into proofs and shapes.</p>
      <h2>If You're Building From Scratch</h2>
      <p>Start with arithmetic and pre-algebra, then algebra, then geometry. Many geometry problems use algebra, so order matters.</p>
      <h2>Use Quizzes to Find Gaps</h2>
      <p>Taking topic-based quizzes helps you see which area needs more work. Focus your study time there first.</p>
    `,
  },
];

/** Récupère tous les posts (pour la liste). */
export function getAllBlogPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Récupère un post par id. */
export function getBlogPostById(id: string): BlogPost | undefined {
  return posts.find((p) => String(p.id) === id);
}

/** Récupère un post par slug. */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Posts similaires (même catégorie ou premiers), excluant l'id donné. */
export function getRelatedBlogPosts(currentId: number, limit = 3): BlogPost[] {
  const current = posts.find((p) => p.id === currentId);
  if (!current) return getAllBlogPosts().slice(0, limit);
  const sameCategory = posts.filter((p) => p.id !== currentId && p.category === current.category);
  const rest = posts.filter((p) => p.id !== currentId && p.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
