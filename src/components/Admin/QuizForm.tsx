'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionEditor from './QuestionEditor';
import RichTextEditor from './RichTextEditor';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Module {
  id: string;
  title: string;
  slug: string;
  course: {
    id: string;
    title: string;
  };
}

interface Answer {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  imageUrl?: string;
  order: number;
}

interface Question {
  id?: string;
  text: string;
  type: string;
  points: number;
  explanation: string;
  timeLimit?: number;
  order: number;
  answers: Answer[];
}

interface QuizFormData {
  id?: string;
  title: string;
  slug: string;
  moduleId: string;
  description: string;
  excerpt: string;
  duration?: number;
  difficulty?: string;
  passingGrade?: number;
  randomizeOrder: boolean;
  maxQuestions?: number;
  featuredImageUrl: string;
  questions: Question[];
}

interface QuizFormProps {
  initialData?: QuizFormData;
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', slug: '', description: '' });
  const [newModule, setNewModule] = useState({ title: '', slug: '', courseId: '', description: '', order: 0 });
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    slug: '',
    moduleId: '',
    description: '',
    excerpt: '',
    duration: undefined,
    difficulty: undefined,
    passingGrade: undefined,
    randomizeOrder: false,
    maxQuestions: undefined,
    featuredImageUrl: '',
    questions: [],
    ...initialData,
  });

  useEffect(() => {
    fetchCourses();
    fetchModules();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        const course = await response.json();
        setCourses([...courses, course]);
        setNewCourse({ title: '', slug: '', description: '' });
        setShowCreateCourse(false);
        alert('Course created successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Error creating course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course');
    }
  };

  const handleCreateModule = async () => {
    if (!newModule.courseId) {
      alert('Please select a course');
      return;
    }

    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule),
      });

      if (response.ok) {
        const moduleItem = await response.json();
        setModules([...modules, moduleItem]);
        setFormData((prev) => ({ ...prev, moduleId: moduleItem.id }));
        setNewModule({ title: '', slug: '', courseId: '', description: '', order: 0 });
        setShowCreateModule(false);
        alert('Module created successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Error creating module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Error creating module');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          type: 'multiple_choice',
          points: 1,
          explanation: '',
          order: prev.questions.length,
          answers: [
            { text: '', isCorrect: false, explanation: '', order: 0 },
            { text: '', isCorrect: false, explanation: '', order: 1 },
          ],
        },
      ],
    }));
  };

  const handleUpdateQuestion = (index: number, question: Question) => {
    setFormData((prev) => {
      const currentQuestion = prev.questions[index];
      // Vérifier si la question a vraiment changé pour éviter les re-renders inutiles
      if (currentQuestion && JSON.stringify(currentQuestion) === JSON.stringify(question)) {
        return prev; // Pas de changement, retourner l'état précédent
      }
      const newQuestions = [...prev.questions];
      newQuestions[index] = question;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData
        ? `/api/admin/quizzes/${initialData.id}`
        : '/api/admin/quizzes';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          moduleId: formData.moduleId || null,
          duration: formData.duration || null,
          difficulty: formData.difficulty ?? '',
          passingGrade: formData.passingGrade || null,
          maxQuestions: formData.maxQuestions || null,
          questions: formData.questions.map((q, qIndex) => ({
            ...q,
            order: qIndex,
            answers: q.answers.map((a, aIndex) => ({
              ...a,
              order: aIndex,
            })),
          })),
        }),
      });

      if (response.ok) {
        router.push('/admin/quizzes');
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        const message = data.details ? `${data.error || 'Error saving'}: ${data.details}` : (data.error || 'Error saving');
        alert(message);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Error saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        {/* Informations de base */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Informations de base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Basic Algebra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => {
                  // Normaliser automatiquement le slug (remplacer les espaces par des tirets)
                  const normalizedSlug = generateSlug(e.target.value);
                  setFormData((prev) => ({ ...prev, slug: normalizedSlug }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ex: basic-algebra"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Module
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (courses.length === 0) {
                      setShowCreateCourse(true);
                    } else {
                      setShowCreateModule(true);
                    }
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ➕ {courses.length === 0 ? 'Create a course' : 'Create a module'}
                </button>
              </div>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData((prev) => ({ ...prev, moduleId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">No module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.course.title} - {module.title}
                  </option>
                ))}
              </select>
              
              {/* Formulaire de création de cours */}
              {showCreateCourse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Créer un nouveau cours</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Titre du cours"
                      value={newCourse.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setNewCourse({
                          ...newCourse,
                          title,
                          slug: newCourse.slug || generateSlug(title),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Slug"
                      value={newCourse.slug}
                      onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <RichTextEditor
                      value={newCourse.description}
                      onChange={(value) => setNewCourse({ ...newCourse, description: value })}
                      placeholder="Enter course description (optional)..."
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCourse}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        Créer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateCourse(false);
                          setNewCourse({ title: '', slug: '', description: '' });
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de création de module */}
              {showCreateModule && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Create a new module</h3>
                  <div className="space-y-3">
                    <select
                      value={newModule.courseId}
                      onChange={(e) => setNewModule({ ...newModule, courseId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Module title"
                      value={newModule.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setNewModule({
                          ...newModule,
                          title,
                          slug: newModule.slug || generateSlug(title),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Slug"
                      value={newModule.slug}
                      onChange={(e) => setNewModule({ ...newModule, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateModule}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModule(false);
                          setNewModule({ title: '', slug: '', courseId: '', description: '', order: 0 });
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Enter quiz description..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <RichTextEditor
                value={formData.excerpt}
                onChange={(value) => setFormData((prev) => ({ ...prev, excerpt: value }))}
                placeholder="Enter quiz excerpt..."
              />
            </div>
          </div>
        </div>

        {/* Paramètres */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Leave empty for no limit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={formData.difficulty || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value === '' ? '' : e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Not specified</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Grade (%) <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.passingGrade || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, passingGrade: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Leave empty for no minimum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Questions <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxQuestions || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxQuestions: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Leave empty for all questions"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Image
              </label>
              <input
                type="url"
                value={formData.featuredImageUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, featuredImageUrl: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="randomizeOrder"
                checked={formData.randomizeOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, randomizeOrder: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="randomizeOrder" className="ml-2 text-sm font-medium text-gray-700">
                Randomize question order
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            ➕ Add Question
          </button>
        </div>

        {formData.questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No questions. Click "Add Question" to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.questions.map((question, index) => (
              <QuestionEditor
                key={question.id || index}
                question={question}
                index={index}
                onUpdate={(q) => handleUpdateQuestion(index, q)}
                onDelete={() => handleDeleteQuestion(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.slug}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
}
