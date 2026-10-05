export interface ReviewAnswer {
  questionId: string;
  correct: boolean;
}

export interface ReviewCardView {
  id: string;
  questionText: string;
  correctAnswer: string;
  quizTitle: string;
  timesWrong: number;
  correctStreak: number;
  dueOn: Date;
}

export interface ReviewDeck {
  dueToday: number;
  total: number;
  cards: ReviewCardView[];
}

export interface PracticeQuiz {
  quizId: string;
}
