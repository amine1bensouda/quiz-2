import QuizForm from '@/components/Admin/QuizForm';

export default function NewQuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Create New Quiz
        </h1>
        <p className="text-gray-600">Fill out the form to create a new quiz</p>
      </div>
      <QuizForm />
    </div>
  );
}
