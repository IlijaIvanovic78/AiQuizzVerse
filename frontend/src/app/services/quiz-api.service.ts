import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Quiz,
  QuizListItem,
  GenerateQuizRequest,
  UploadPdfResponse,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuizApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Generate a quiz using AI (LangGraph pipeline)
   */
  generateQuiz(request: GenerateQuizRequest): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.apiUrl}/ai/generate-quiz`, request);
  }

  /**
   * Upload a PDF for RAG-based quiz generation
   */
  uploadPdf(file: File): Observable<UploadPdfResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadPdfResponse>(`${this.apiUrl}/upload/pdf`, formData);
  }

  /**
   * Get all quizzes created by the current user
   */
  getMyQuizzes(): Observable<QuizListItem[]> {
    return this.http.get<QuizListItem[]>(`${this.apiUrl}/quizzes`);
  }

  /**
   * Get quiz details with questions
   */
  getQuizDetail(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/quizzes/${quizId}`);
  }

  /**
   * Delete a quiz (owner only)
   */
  deleteQuiz(quizId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/quizzes/${quizId}`);
  }
}
