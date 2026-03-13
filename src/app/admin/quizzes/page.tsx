import Link from 'next/link';
import DeleteQuizButton from '@/components/Admin/DeleteQuizButton';
import { difficultyToEnglish, stripHtml } from '@/lib/utils';
import { getAllQuiz } from '@/lib/quiz-service';

type GroupedQuizzes = {
  [courseTitle: string]: {
    [moduleTitle: string]: any[];
  };
};

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const quizzes = await getAllQuiz();

  const searchQuery = searchParams?.q?.toLowerCase().trim() || '';

  const grouped: GroupedQuizzes = {};

  for (const quiz of quizzes) {
    const rawTitle =
      typeof quiz.title === 'string'
        ? quiz.title
        : quiz.title?.rendered || '';
    const slug = quiz.slug || '';

    const matchesSearch =
      !searchQuery ||
      rawTitle.toLowerCase().includes(searchQuery) ||
      slug.toLowerCase().includes(searchQuery);

    if (!matchesSearch) {
      continue;
    }

    // On récupère les infos de cours/module depuis les champs ACF convertis,
    // et on garde l'accès à quiz.module uniquement en any pour éviter l'erreur TS.
    const anyQuiz = quiz as any;
    const courseTitle =
      anyQuiz.module?.course?.title || 'Unassigned course';
    const moduleTitle =
      quiz.acf?.categorie || anyQuiz.module?.title || 'Unassigned module';

    if (!grouped[courseTitle]) {
      grouped[courseTitle] = {};
    }
    if (!grouped[courseTitle][moduleTitle]) {
      grouped[courseTitle][moduleTitle] = [];
    }
    grouped[courseTitle][moduleTitle].push(quiz);
  }

  const allQuizzesCount = quizzes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Quiz Management
          </h1>
          <p className="text-gray-600">{allQuizzesCount} quiz total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <form method="get" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search by title or slug..."
              defaultValue={searchParams?.q || ''}
              className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <Link
                href="/admin/quizzes"
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Reset
              </Link>
            )}
          </form>
          <Link
            href="/admin/quizzes/new"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg text-center"
          >
            ➕ New Quiz
          </Link>
        </div>
      </div>

      {allQuizzesCount > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([courseTitle, modules]) => {
            const courseQuizCount = Object.values(modules).reduce(
              (acc, moduleQuizzes) => acc + (moduleQuizzes as any[]).length,
              0
            );

            return (
              <section
                key={courseTitle}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {courseTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {courseQuizCount} quiz
                      {courseQuizCount > 1 ? 'zes' : ''} in this course
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {Object.entries(modules).map(([moduleTitle, moduleQuizzes]) => {
                    const list = moduleQuizzes as any[];
                    if (list.length === 0) return null;

                    return (
                      <div key={moduleTitle} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {moduleTitle}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {list.length} quiz
                              {list.length > 1 ? 'zes' : ''} in this
                              module
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Questions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Difficulty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {list.map((quiz: any) => (
                                <tr
                                  key={quiz.prismaId ?? quiz.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-3">
                                    <div className="font-semibold text-gray-900">
                                      {typeof quiz.title === 'string'
                                        ? quiz.title
                                        : quiz.title?.rendered || 'No title'}
                                    </div>
                                    {quiz.content?.rendered && (
                                      <div className="text-sm text-gray-500 mt-1 truncate max-w-xl">
                                        {stripHtml(quiz.content.rendered)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-3">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                      {quiz.slug}
                                    </code>
                                  </td>
                                  <td className="px-6 py-3 text-gray-700">
                                    {quiz.acf?.questions?.length ||
                                      quiz.acf?.nombre_questions ||
                                      0}
                                  </td>
                                  <td className="px-6 py-3">
                                    {(() => {
                                      const d = quiz.acf?.niveau_difficulte;
                                      const isEmpty =
                                        !d ||
                                        String(d).trim() === '' ||
                                        d === 'Moyen';
                                      const label = isEmpty
                                        ? 'Not specified'
                                        : difficultyToEnglish(d);
                                      return (
                                        <span
                                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            isEmpty
                                              ? 'bg-gray-100 text-gray-600'
                                              : 'bg-indigo-100 text-indigo-800'
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="flex items-center space-x-2">
                                      <Link
                                        href={`/admin/quizzes/${encodeURIComponent(
                                          quiz.slug
                                        )}/edit`}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                      >
                                        Edit
                                      </Link>
                                      <DeleteQuizButton
                                        quizId={quiz.prismaId ?? String(quiz.id)}
                                        quizTitle={
                                          typeof quiz.title === 'string'
                                            ? quiz.title
                                            : quiz.title?.rendered ||
                                              'No title'
                                        }
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No quizzes</h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first quiz
          </p>
          <Link
            href="/admin/quizzes/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            Create a quiz
          </Link>
        </div>
      )}
    </div>
  );
}
