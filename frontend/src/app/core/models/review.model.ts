export interface ReviewCardView {
  id: string;
  questionText: string;
  correctAnswer: string;
  quizTitle: string;
  timesWrong: number;
  correctStreak: number;
  dueOn: string;
}

export interface ReviewDeck {
  dueToday: number;
  total: number;
  cards: ReviewCardView[];
}

export interface PracticeRequest {
  questionIds?: string[];
}

export interface PracticeQuiz {
  quizId: string;
}
