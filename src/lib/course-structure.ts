// Hiérarchie ACT : Cours -> Modules -> Quiz
// Pour l'instant, cette structure est codée en dur à partir de la
// hiérarchie Tutor LMS (noms de quiz / slugs). On pourra plus tard
// la générer dynamiquement via l'API de cours de Tutor LMS.

export interface CourseModuleConfig {
  id: string;
  title: string;
  description?: string;
  quizSlugs: string[];
}

export interface CourseConfig {
  id: string;
  title: string;
  modules: CourseModuleConfig[];
}

export const ACT_MATH_COURSE: CourseConfig = {
  id: 'act-math',
  title: 'Math Exams/Quizzes',
  modules: [
    {
      id: 'module-1',
      title: 'MODULE 1: FUNDAMENTAL QUIZZES',
      quizSlugs: [
        'numbers-operations-2-3',
        'fractions-rational-expressions-2-3',
        'factors-multiples-2-2-3',
        'factorization-simplification-2-3',
        'averages-2-3',
        'percentages-2-3',
        'rates-ratios-2-3',
        'equations-2-3',
        'inequalities-2-3',
        'quadratics-2-3',
        'system-of-equation-2-3',
        'sequences-2-3',
        'lines-2-3',
        'functions-2-3',
        'logarithm-2-3',
        'area-volume-2-3',
        'probability-2-3',
        'statistics-2-3',
        'transformations-images-2-3',
        'circles-ellipses-conic-sections-2-3',
      ],
    },
    {
      id: 'module-2',
      title: 'MODULE 2: INTERMEDIATE QUIZZES',
      quizSlugs: [
        'numbers-operations-2-3-2',
        'fractions-rational-expressions-2-2-3',
        'factors-multiples-2-2-3-2',
        'factorization-simplification-2-3-2',
        'averages-2-3',
        'percentages-2-3',
        'rates-ratios-2-3-2',
        'equations-2-3-2',
        'inequalities-2-3-2',
        'quadratics-2-3-2',
        'system-of-equation-2-3-2',
        'sequences-2-3-2',
        'lines-2-3-2',
        'functions-2-3-2',
        'logarithm-2-3-2',
        'area-volume-2-3-2',
        'probability-2-3-2',
        'statistics-2-3-2',
        'transformations-images-2-3-2',
        'circles-ellipses-conic-sections-2-3-2',
        'trigonometry-2-3-2',
      ],
    },
    {
      id: 'module-3',
      title: 'MODULE 3: ADVANCED QUIZZES',
      quizSlugs: [
        'exam-10',
        'exam-4-2',
        'exam-5-2',
        'exam-6',
        'exam-7',
        'exam-8',
        'exam-9',
        'exam-14',
        'exam-3-2-2-2',
        'exam-17',
        'exam-3-2',
        'exam-3-2-2',
        'exam-4-2-2',
        'exam-17',
        'exam-1-4',
      ],
    },
    {
      id: 'module-4',
      title: 'MODULE 4: ADDITIONAL WORD PROBLEMS',
      quizSlugs: [
        'word-problems-with-algebraic-modeling',
        'polynomial-operations-and-zeros',
        'rational-expressions',
        'transformations-of-functions',
        'function-notation-evaluation',
        'exponential-growth-and-decay',
        'systems-of-inequalities-basic-graph-based-problems',
      ],
    },
    {
      id: 'module-5',
      title: 'MODULE 5: Timed Mini Exams',
      quizSlugs: [
        'mini-exam-15',
        'mini-exam-14-2',
        'mini-exam-13-4',
        'mini-exam-12-5',
        'mini-exam-11-5',
        'mini-exam-10-4',
        'mini-exam-9-4',
        'mini-exam-8-4',
        'mini-exam-7-4',
        'mini-exam-6-4',
        'mini-exam-5-4',
        'mini-exam-4-2',
        'mini-exam-3',
        'mini-exam-2',
        'mini-exam-1',
      ],
    },
    // MODULE 6: Timed Simulation Exams -> exams déjà listés plus haut
  ],
};

