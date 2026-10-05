import { Pipe, PipeTransform } from '@angular/core';
import { QuizLanguage } from '../../core/models/quiz.model';

// Each language is named in its own words, so a Serbian player finds "Srpski".
const LANGUAGE_LABELS: Record<QuizLanguage, string> = {
  EN: 'English',
  SR: 'Srpski',
};

@Pipe({ name: 'languageLabel' })
export class LanguageLabelPipe implements PipeTransform {
  transform(language: QuizLanguage): string {
    return LANGUAGE_LABELS[language];
  }
}
