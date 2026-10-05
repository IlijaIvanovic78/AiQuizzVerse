import { Pipe, PipeTransform } from '@angular/core';
import { QuizTheme } from '../../core/models/quiz.model';

const THEME_LABELS: Record<QuizTheme, string> = {
  SPACE: 'Space',
  HISTORY: 'History',
  SCIENCE: 'Science',
  NATURE: 'Nature',
  GEOGRAPHY: 'Geography',
  MATH: 'Math',
  LANGUAGE: 'Language',
  ART: 'Art',
  MUSIC: 'Music',
  SPORTS: 'Sports',
  TECHNOLOGY: 'Technology',
  GENERAL: 'General',
};

@Pipe({ name: 'themeLabel' })
export class ThemeLabelPipe implements PipeTransform {
  transform(theme: QuizTheme): string {
    return THEME_LABELS[theme];
  }
}
