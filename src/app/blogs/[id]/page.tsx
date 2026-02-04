import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog Post',
  description: 'Read our blog post',
};

// In a real app, this would fetch from a CMS or API
const blogPosts: Record<string, any> = {
  '1': {
    id: 1,
    title: '10 Tips to Master Algebra',
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
    date: '2024-01-15',
    category: 'Learning Tips',
  },
  '2': {
    id: 2,
    title: 'Understanding Calculus: A Beginner\'s Guide',
    content: `
      <p>Calculus is a branch of mathematics that deals with rates of change and accumulation. This guide will introduce you to the fundamental concepts.</p>
      
      <h2>What is Calculus?</h2>
      <p>Calculus is divided into two main branches: differential calculus and integral calculus. Differential calculus focuses on rates of change, while integral calculus deals with accumulation.</p>
      
      <h2>Key Concepts</h2>
      <p>Understanding limits, derivatives, and integrals is essential for mastering calculus. These concepts form the foundation of advanced mathematical analysis.</p>
    `,
    date: '2024-01-10',
    category: 'Mathematics',
  },
  '3': {
    id: 3,
    title: 'How to Prepare for Math Competitions',
    content: `
      <p>Mathematics competitions require a unique set of skills and preparation strategies. Here's how to excel:</p>
      
      <h2>Preparation Strategies</h2>
      <p>Effective preparation involves regular practice, understanding problem-solving techniques, and developing time management skills.</p>
      
      <h2>Key Areas to Focus On</h2>
      <p>Focus on algebra, geometry, number theory, and combinatorics. These areas frequently appear in mathematics competitions.</p>
    `,
    date: '2024-01-05',
    category: 'Competitions',
  },
};

// Générer les paramètres statiques pour l'export
export function generateStaticParams() {
  return Object.keys(blogPosts).map((id) => ({
    id: id,
  }));
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function BlogPostPage({ params }: PageProps) {
  const post = blogPosts[params.id];

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Blogs
      </Link>

      <article>
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mb-4">
            {post.category}
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <p className="text-gray-500">
            {new Date(post.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}

