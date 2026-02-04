import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blogs',
  description: `Read our latest articles and educational content from ${SITE_NAME}`,
};

// Example blog posts - in a real app, these would come from a CMS or API
const blogPosts = [
  {
    id: 1,
    title: '10 Tips to Master Algebra',
    excerpt: 'Discover effective strategies to improve your algebra skills and build confidence in solving equations.',
    date: '2024-01-15',
    category: 'Learning Tips',
  },
  {
    id: 2,
    title: 'Understanding Calculus: A Beginner\'s Guide',
    excerpt: 'A comprehensive introduction to calculus concepts, from limits to derivatives and integrals.',
    date: '2024-01-10',
    category: 'Mathematics',
  },
  {
    id: 3,
    title: 'How to Prepare for Math Competitions',
    excerpt: 'Expert advice on preparing for mathematics competitions and excelling in competitive problem-solving.',
    date: '2024-01-05',
    category: 'Competitions',
  },
];

export default function BlogsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blogs</h1>
        <p className="text-xl text-gray-600">
          Explore our latest articles, tips, and educational content to enhance your mathematics learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blogs/${post.id}`}
            className="card-modern p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {post.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
              {post.title}
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span className="text-gray-900 font-semibold">Read more →</span>
            </div>
          </Link>
        ))}
      </div>

      {blogPosts.length === 0 && (
        <div className="text-center py-16 card-modern">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 text-lg">No blog posts available at the moment.</p>
        </div>
      )}
    </div>
  );
}

