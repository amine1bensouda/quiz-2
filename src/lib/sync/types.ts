/** Contrat de synchronisation premium (quiz-main) → gratuit (the-school) */

export const SYNC_PAYLOAD_VERSION = 1 as const;

export type SyncCoursePayload = {
  sourceCourseId: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
};

export type SyncModulePayload = {
  sourceModuleId: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  course: SyncCoursePayload | null;
};

export type SyncAnswerPayload = {
  sourceAnswerId: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
  imageUrl: string | null;
  order: number;
};

export type SyncQuestionPayload = {
  sourceQuestionId: string;
  text: string;
  type: string;
  points: number;
  explanation: string | null;
  timeLimit: number | null;
  order: number;
  answers: SyncAnswerPayload[];
};

export type SyncQuizPayload = {
  version: typeof SYNC_PAYLOAD_VERSION;
  sourceQuizId: string;
  sourceUpdatedAt: string;
  payloadHash: string;
  quiz: {
    title: string;
    slug: string;
    description: string | null;
    excerpt: string | null;
    duration: number;
    difficulty: string | null;
    passingGrade: number;
    randomizeOrder: boolean;
    maxQuestions: number | null;
    featuredImageUrl: string | null;
    order: number;
    module: SyncModulePayload | null;
  };
  questions: SyncQuestionPayload[];
};

export type SyncIngestResponse = {
  ok: boolean;
  localQuizId: string;
  localSlug: string;
  syncedAt: string;
  action: 'created' | 'updated';
};

export type SyncPublishStatus =
  | 'NOT_PUBLISHED'
  | 'PUBLISHED'
  | 'OUT_OF_DATE'
  | 'FAILED';
