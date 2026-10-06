import { DocumentSummary } from '../../core/models/document.model';
import { Audience } from '../../core/models/quiz.model';
import { ItemImageName } from '../../shared/icons';

export type CreateKind = 'QUIZ' | 'PATH';

export type WizardStep = 'source' | 'make' | 'settings' | 'questions';

export type CreatePhase = 'wizard' | 'working' | 'done' | 'failed';

export type GenerationStepState = 'done' | 'active' | 'waiting';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string }
  | { status: 'ready'; document: DocumentSummary }
  | { status: 'failed'; message: string };

export interface PictureChoice<T> {
  value: T;
  title: string;
  text: string;
  image: ItemImageName;
}

export interface AudienceChoice {
  value: Audience;
  ages: string;
  text: string;
  heroKey: string;
}
