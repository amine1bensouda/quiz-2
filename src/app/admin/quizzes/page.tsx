import DeleteQuizButton from '@/components/Admin/DeleteQuizButton';
import { difficultyToEnglish, stripHtml, shouldDisplayDifficulty } from '@/lib/utils';
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
    <div className="space-y-6 text-[#eeeaf4]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Quiz Management
          </h1>
          <p className="text-[rgba(238,234,244,0.55)]">{allQuizzesCount} quiz total</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <form method="get" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search by title or slug..."
              defaultValue={searchParams?.q || ''}
              className="w-full rounded-xl border border-white/10 bg-[#0e0e1a] px-3 py-2 text-sm text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/20 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#f5c14a] px-4 py-2 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
            >
              Search
            </button>
            {searchQuery && (
              <a
                href="/admin/quizzes"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
              >
                Reset
              </a>
            )}
          </form>
          <a
            href="/admin/quizzes/new"
            className="rounded-full bg-[#f5c14a] px-6 py-2.5 text-center text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
          >
            + New Quiz
          </a>
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
                className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-[#0e0e1a] px-6 py-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#eeeaf4]">
                      {courseTitle}
                    </h2>
                    <p className="text-sm text-[rgba(238,234,244,0.45)]">
                      {courseQuizCount} quiz
                      {courseQuizCount > 1 ? 'zes' : ''} in this course
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {Object.entries(modules).map(([moduleTitle, moduleQuizzes]) => {
                    const list = moduleQuizzes as any[];
                    if (list.length === 0) return null;

                    return (
                      <div key={moduleTitle} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div>
                            <h3 className="text-lg font-semibold text-[#eeeaf4]">
                              {moduleTitle}
                            </h3>
                            <p className="text-xs text-[rgba(238,234,244,0.45)]">
                              {list.length} quiz
                              {list.length > 1 ? 'zes' : ''} in this
                              module
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-white/10 bg-[#0e0e1a]">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                                  Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                                  Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                                  Questions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                                  Difficulty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {list.map((quiz: any) => (
                                <tr
                                  key={quiz.prismaId ?? quiz.id}
                                  className="transition-colors hover:bg-white/[0.03]"
                                >
                                  <td className="px-6 py-3">
                                    <div className="font-semibold text-[#eeeaf4]">
                                      {typeof quiz.title === 'string'
                                        ? quiz.title
                                        : quiz.title?.rendered || 'No title'}
                                    </div>
                                    {quiz.content?.rendered && (
                                      <div className="mt-1 max-w-xl truncate text-sm text-[rgba(238,234,244,0.45)]">
                                        {stripHtml(quiz.content.rendered)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-3">
                                    <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-1 text-xs text-[rgba(238,234,244,0.55)]">
                                      {quiz.slug}
                                    </code>
                                  </td>
                                  <td className="px-6 py-3 text-[rgba(238,234,244,0.75)]">
                                    {quiz.acf?.questions?.length ||
                                      quiz.acf?.nombre_questions ||
                                      0}
                                  </td>
                                  <td className="px-6 py-3">
                                    {(() => {
                                      const d = quiz.acf?.niveau_difficulte;
                                      const isEmpty = !shouldDisplayDifficulty(d);
                                      const label = isEmpty
                                        ? 'Not specified'
                                        : difficultyToEnglish(d);
                                      return (
                                        <span
                                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            isEmpty
                                              ? 'bg-white/10 text-[rgba(238,234,244,0.55)]'
                                              : 'border border-[#b388ff]/30 bg-[#b388ff]/15 text-[#d4b8ff]'
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="flex items-center space-x-2">
                                      <a
                                        href={`/admin/quizzes/${encodeURIComponent(
                                          quiz.slug
                                        )}/edit`}
                                        className="rounded-lg border border-white/15 px-3 py-1 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                                      >
                                        Edit
                                      </a>
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
        <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
          <div className="mb-4 text-6xl">📝</div>
          <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">No quizzes</h3>
          <p className="mb-6 text-[rgba(238,234,244,0.55)]">
            Start by creating your first quiz
          </p>
          <a
            href="/admin/quizzes/new"
            className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
          >
            Create a quiz
          </a>
        </div>
      )}
    </div>
  );
}
