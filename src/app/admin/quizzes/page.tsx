import { getAllQuiz } from '@/lib/quiz-service';
import Link from 'next/link';
import DeleteQuizButton from '@/components/Admin/DeleteQuizButton';

export default async function AdminQuizzesPage() {
  const quizzes = await getAllQuiz();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gestion des Quiz
          </h1>
          <p className="text-gray-600">{quizzes.length} quiz au total</p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
        >
          ➕ Nouveau Quiz
        </Link>
      </div>

      {quizzes.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Difficulté
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {typeof quiz.title === 'string' ? quiz.title : quiz.title?.rendered || 'Sans titre'}
                      </div>
                      {quiz.content?.rendered && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {quiz.content.rendered}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {quiz.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {quiz.acf?.questions?.length || quiz.acf?.nombre_questions || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {quiz.acf?.niveau_difficulte || 'Moyen'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/quizzes/${quiz.slug}/edit`}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          Modifier
                        </Link>
                        <DeleteQuizButton 
                          quizId={quiz.slug} 
                          quizTitle={typeof quiz.title === 'string' ? quiz.title : quiz.title?.rendered || 'Sans titre'} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun quiz</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier quiz</p>
          <Link
            href="/admin/quizzes/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            Créer un quiz
          </Link>
        </div>
      )}
    </div>
  );
}
