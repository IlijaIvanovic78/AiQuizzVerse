import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateQuizRequest,
  GenerateQuizRequest,
  QuestionInput,
  QuestionView,
  QuizDetail,
  QuizSummary,
  UpdateQuizRequest,
} from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizzesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/quizzes`;

  list(): Observable<QuizSummary[]> {
    return this.http.get<QuizSummary[]>(this.baseUrl);
  }

  featured(): Observable<QuizSummary[]> {
    return this.http.get<QuizSummary[]>(`${this.baseUrl}/featured`);
  }

  get(quizId: string): Observable<QuizDetail> {
    return this.http.get<QuizDetail>(`${this.baseUrl}/${quizId}`);
  }

  create(request: CreateQuizRequest): Observable<QuizDetail> {
    return this.http.post<QuizDetail>(this.baseUrl, request);
  }

  generate(request: GenerateQuizRequest): Observable<QuizDetail> {
    return this.http.post<QuizDetail>(`${this.baseUrl}/generate`, request);
  }

  update(quizId: string, changes: UpdateQuizRequest): Observable<QuizDetail> {
    return this.http.patch<QuizDetail>(`${this.baseUrl}/${quizId}`, changes);
  }

  delete(quizId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${quizId}`);
  }

  addQuestion(quizId: string, question: QuestionInput): Observable<QuestionView> {
    return this.http.post<QuestionView>(`${this.baseUrl}/${quizId}/questions`, question);
  }

  updateQuestion(
    quizId: string,
    questionId: string,
    question: QuestionInput,
  ): Observable<QuestionView> {
    return this.http.put<QuestionView>(
      `${this.baseUrl}/${quizId}/questions/${questionId}`,
      question,
    );
  }

  deleteQuestion(quizId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${quizId}/questions/${questionId}`);
  }
}
