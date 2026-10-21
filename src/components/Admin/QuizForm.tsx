'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QuestionEditor from './QuestionEditor';
import RichTextEditor from './RichTextEditor';
import ImageUploadField from './ImageUploadField';
import { AdminSessionExpiredError, ensureAdminSession, checkAdminResponse } from '@/lib/admin-session-client';
import {
  htmlContainsDataImages,
  replaceDataImagesInQuizPayload,
} from '@/lib/html-data-images';
import { restoreQuestionMarkup, stripHtml } from '@/lib/utils';

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
    status?: string;
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

function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    text: restoreQuestionMarkup(question.text || ''),
    explanation: restoreQuestionMarkup(question.explanation || ''),
    answers: (question.answers || []).map((answer) => ({
      ...answer,
      text: restoreQuestionMarkup(answer.text || ''),
      explanation: restoreQuestionMarkup(answer.explanation || ''),
    })),
  };
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
    questions: (initialData?.questions ?? []).map(normalizeQuestion),
  });
  const [questionQuery, setQuestionQuery] = useState('');
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);
  const scrollTargetRef = useRef<number | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

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

  const jumpToQuestion = (index: number) => {
    scrollTargetRef.current = index;
    setQuestionQuery('');
    setOpenQuestionIndex(index);
    setScrollNonce((nonce) => nonce + 1);
  };

  useEffect(() => {
    if (scrollTargetRef.current == null) return;
    const index = scrollTargetRef.current;
    const node = document.getElementById(`admin-question-${index}`);
    if (!node) return;
    scrollTargetRef.current = null;
    const nav = document.querySelector('.admin-nav');
    const navHeight = nav instanceof HTMLElement ? nav.getBoundingClientRect().height : 0;
    const top = node.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [scrollNonce]);

  const handleAddQuestion = () => {
    const nextIndex = formData.questions.length;
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
    jumpToQuestion(nextIndex);
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
    setOpenQuestionIndex((current) => {
      if (current == null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSessionError(null);
    setStatusMessage(null);

    try {
      // Flush debounced RichTextEditor values into React state
      window.dispatchEvent(new Event('richtext-flush'));
      await new Promise((resolve) => setTimeout(resolve, 80));
      await ensureAdminSession();

      const latest = formDataRef.current;
      let payload = {
        ...latest,
        moduleId: latest.moduleId || null,
        duration: latest.duration || null,
        difficulty: latest.difficulty ?? '',
        passingGrade: latest.passingGrade || null,
        maxQuestions: latest.maxQuestions || null,
        questions: latest.questions.map((q, qIndex) => ({
          ...q,
          order: qIndex,
          answers: q.answers.map((a, aIndex) => ({
            ...a,
            order: aIndex,
          })),
        })),
      };

      const hasEmbeddedPhotos =
        htmlContainsDataImages(payload.description) ||
        htmlContainsDataImages(payload.excerpt) ||
        payload.questions.some(
          (q) =>
            htmlContainsDataImages(q.text) ||
            htmlContainsDataImages(q.explanation) ||
            q.answers.some(
              (a) => htmlContainsDataImages(a.text) || htmlContainsDataImages(a.explanation)
            )
        );

      if (hasEmbeddedPhotos) {
        setStatusMessage('Uploading embedded photos to storage…');
        payload = await replaceDataImagesInQuizPayload(payload, setStatusMessage);
        setFormData((prev) => ({
          ...prev,
          description: payload.description || '',
          excerpt: payload.excerpt || '',
          questions: payload.questions || prev.questions,
        }));
      }

      const body = JSON.stringify(payload);
      const bodyMb = body.length / (1024 * 1024);
      if (bodyMb > 4) {
        setStatusMessage(
          `Payload still large (${bodyMb.toFixed(1)} MB). Saving may fail if the server limit is low.`
        );
      } else {
        setStatusMessage('Saving quiz…');
      }

      const url = initialData
        ? `/api/admin/quizzes/${initialData.id}`
        : '/api/admin/quizzes';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      checkAdminResponse(response);
      if (response.ok) {
        router.push('/admin/quizzes');
        router.refresh();
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (response.status === 413 || !contentType.includes('application/json')) {
        alert(
          `Save failed (HTTP ${response.status}). The quiz payload is too large for the server.\n` +
            `Payload size: ${bodyMb.toFixed(1)} MB.\n` +
            `Tip: photos must be uploaded as CDN URLs (not base64). Try again after photos finish uploading.`
        );
        return;
      }

      const data = await response.json().catch(() => ({}));
      const message = data.details
        ? `${data.error || 'Error saving'}: ${data.details}`
        : data.error || `Error saving (HTTP ${response.status})`;
      alert(message);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error instanceof AdminSessionExpiredError) {
        setSessionError(error.message);
      } else {
        alert(error instanceof Error ? error.message : 'Error saving');
      }
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sessionError && (
        <div role="alert" className="sticky top-4 z-50 rounded-lg border border-amber-400 bg-[#12121f] p-4 text-amber-200">
          <p>{sessionError}</p>
          <a href="/admin/login" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline">
            Sign in in a new tab
          </a>
        </div>
      )}
      <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] shadow-lg p-6 space-y-6">
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
                    {module.course.title}
                    {module.course.status !== 'published' ? ' (draft)' : ''}: {module.title}
                  </option>
                ))}
              </select>
              
              {/* Formulaire de création de cours */}
              {showCreateCourse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Create a new course</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Course title"
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
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateCourse(false);
                          setNewCourse({ title: '', slug: '', description: '' });
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                      >
                        Cancel
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
                <option value="Fundamental">Fundamental</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
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
              <ImageUploadField
                label="Quiz image"
                value={formData.featuredImageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, featuredImageUrl: url }))}
                placeholder="or paste a URL (https://...)"
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
      <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] shadow-lg p-6">
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
          <div className="space-y-4">
            <input
              type="search"
              value={questionQuery}
              onChange={(event) => setQuestionQuery(event.target.value)}
              placeholder="Rechercher une question"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {formData.questions.length > 6 && (
              <div className="flex flex-wrap gap-1">
                {formData.questions.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => jumpToQuestion(index)}
                    className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
                      openQuestionIndex === index
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
            {(() => {
              const query = questionQuery.trim().toLowerCase();
              const visible = formData.questions
                .map((question, index) => ({ question, index }))
                .filter(({ question }) => {
                  if (!query) return true;
                  const haystack = stripHtml(
                    [
                      question.text,
                      question.explanation,
                      ...question.answers.map((answer) => `${answer.text} ${answer.explanation}`),
                    ].join(' ')
                  ).toLowerCase();
                  return haystack.includes(query);
                });
              if (visible.length === 0) {
                return (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Aucune question ne correspond.
                  </p>
                );
              }
              return (
                <div className="space-y-4">
                  {visible.map(({ question, index }) => (
                    <QuestionEditor
                      key={question.id || index}
                      question={question}
                      index={index}
                      expanded={openQuestionIndex === index}
                      onToggle={() =>
                        setOpenQuestionIndex((current) => (current === index ? null : index))
                      }
                      onUpdate={(q) => handleUpdateQuestion(index, q)}
                      onDelete={() => handleDeleteQuestion(index)}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-3">
        {statusMessage && (
          <p className="text-sm font-medium text-amber-200">{statusMessage}</p>
        )}
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
            {loading ? statusMessage || 'Saving...' : initialData ? 'Update' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </form>
  );
}
