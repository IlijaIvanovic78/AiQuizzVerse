import { Prisma, Question } from '@prisma/client';
import { PathResult } from '../learning-paths/learning-paths.types';
import { ReviewAnswer } from '../review/review.types';
import { PUBLIC_USER_SELECT, toPublicUser } from '../users/user.mapper';
import {
  MatchHistoryEntry,
  MatchResult,
  MatchView,
  PlayerAnswerRecord,
  ResultPlayer,
  ResultQuestion,
  SessionSetup,
} from './matches.types';
import { playerOutcome } from './scoring';

const PLAYERS_WITH_USERS = {
  orderBy: { joinedAt: 'asc' },
  include: { user: { select: PUBLIC_USER_SELECT } },
} satisfies Prisma.Match$playersArgs;

export const MATCH_VIEW_INCLUDE = {
  quiz: {
    select: {
      id: true,
      title: true,
      theme: true,
      kind: true,
      timePerQuestion: true,
      _count: { select: { questions: true } },
    },
  },
  players: PLAYERS_WITH_USERS,
} satisfies Prisma.MatchInclude;

export const HISTORY_INCLUDE = {
  match: { include: MATCH_VIEW_INCLUDE },
} satisfies Prisma.MatchPlayerInclude;

export const MATCH_RESULT_INCLUDE = {
  quiz: { include: { questions: { orderBy: { position: 'asc' } }, pathStep: true } },
  players: PLAYERS_WITH_USERS,
} satisfies Prisma.MatchInclude;

export const SESSION_SETUP_INCLUDE = {
  quiz: { include: { questions: { orderBy: { position: 'asc' } } } },
  players: { orderBy: { joinedAt: 'asc' }, select: { userId: true } },
} satisfies Prisma.MatchInclude;

export type MatchWithPlayers = Prisma.MatchGetPayload<{ include: typeof MATCH_VIEW_INCLUDE }>;
export type HistoryRow = Prisma.MatchPlayerGetPayload<{ include: typeof HISTORY_INCLUDE }>;
export type ResultMatch = Prisma.MatchGetPayload<{ include: typeof MATCH_RESULT_INCLUDE }>;
export type ResultMatchPlayer = ResultMatch['players'][number];
type SessionSetupRow = Prisma.MatchGetPayload<{ include: typeof SESSION_SETUP_INCLUDE }>;

export interface ResultExtras {
  path: PathResult | null;
  coinCapReached: boolean;
}

export function toMatchView(match: MatchWithPlayers, connectedUserIds: string[]): MatchView {
  return {
    id: match.id,
    mode: match.mode,
    status: match.status,
    inviteCode: match.inviteCode,
    hostId: match.hostId,
    quiz: {
      id: match.quiz.id,
      title: match.quiz.title,
      theme: match.quiz.theme,
      questionCount: match.quiz._count.questions,
      timePerQuestion: match.quiz.timePerQuestion,
      kind: match.quiz.kind,
    },
    players: match.players.map((player) => ({
      user: toPublicUser(player.user),
      score: player.score,
      correctCount: player.correctCount,
      isConnected: connectedUserIds.includes(player.userId),
    })),
  };
}

export function toHistoryEntry(row: HistoryRow): MatchHistoryEntry {
  const { match } = row;
  const opponent = match.players.find((player) => player.userId !== row.userId);
  const someoneWon = match.players.some((player) => player.isWinner);
  return {
    matchId: match.id,
    mode: match.mode,
    quizTitle: match.quiz.title,
    theme: match.quiz.theme,
    playedAt: match.endedAt ?? match.createdAt,
    myScore: row.score,
    correctCount: row.correctCount,
    questionCount: match.quiz._count.questions,
    result: playerOutcome(match.mode, row.isWinner, someoneWon),
    opponent: opponent ? toPublicUser(opponent.user) : null,
  };
}

export function toMatchResult(
  match: ResultMatch,
  viewer: ResultMatchPlayer,
  extras: ResultExtras,
): MatchResult {
  return {
    matchId: match.id,
    mode: match.mode,
    quizId: match.quizId,
    quizTitle: match.quiz.title,
    theme: match.quiz.theme,
    kind: match.quiz.kind,
    questionCount: match.quiz.questions.length,
    players: match.players.map(toResultPlayer),
    questions: toResultQuestions(match.quiz.questions, readAnswers(viewer.answers)),
    path: extras.path,
    leveledUp: viewer.leveledUp,
    coinCapReached: extras.coinCapReached,
  };
}

export function toSessionSetup(match: SessionSetupRow): SessionSetup {
  return {
    match: {
      id: match.id,
      mode: match.mode,
      hostId: match.hostId,
      quiz: {
        id: match.quiz.id,
        kind: match.quiz.kind,
        difficulty: match.quiz.difficulty,
        timePerQuestion: match.quiz.timePerQuestion,
      },
      playerIds: match.players.map((player) => player.userId),
    },
    questions: match.quiz.questions,
  };
}

/** Review quizzes hold copies, so mistakes are recorded on the original question's card. */
export function toReviewAnswers(
  answers: PlayerAnswerRecord[],
  questions: Question[],
): ReviewAnswer[] {
  return answers.map((answer) => {
    const question = questions.find((candidate) => candidate.id === answer.questionId);
    return {
      questionId: question?.sourceQuestionId ?? answer.questionId,
      correct: answer.correct,
    };
  });
}

function toResultPlayer(player: ResultMatchPlayer): ResultPlayer {
  return {
    user: toPublicUser(player.user),
    score: player.score,
    correctCount: player.correctCount,
    isWinner: player.isWinner,
    xpEarned: player.xpEarned,
    coinsEarned: player.coinsEarned,
  };
}

/** Only the questions that were actually played, in the order they were asked. */
function toResultQuestions(questions: Question[], answers: PlayerAnswerRecord[]): ResultQuestion[] {
  return answers.flatMap((answer) => {
    const question = questions.find((candidate) => candidate.id === answer.questionId);
    if (!question) {
      return [];
    }
    return [
      {
        questionId: question.id,
        text: question.text,
        options: question.options,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        myAnswer: answer.optionIndex,
      },
    ];
  });
}

function readAnswers(answers: Prisma.JsonValue): PlayerAnswerRecord[] {
  return Array.isArray(answers) ? (answers as PlayerAnswerRecord[]) : [];
}
