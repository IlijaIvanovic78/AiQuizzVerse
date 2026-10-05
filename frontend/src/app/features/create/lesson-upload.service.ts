import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { readErrorMessage } from '../../core/api/api-error';
import { DocumentsApiService } from '../../core/api/documents-api.service';
import { pdfProblem } from './create.rules';
import { UploadState } from './create.types';

// The lesson PDF a quiz or path is made from. Only the create wizard uses it, so the create page
// provides this service and the upload ends when the page closes.
@Injectable()
export class LessonUploadService {
  private readonly documentsApi = inject(DocumentsApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly uploadState = signal<UploadState>({ status: 'idle' });
  readonly state = this.uploadState.asReadonly();
  readonly document = computed(() => {
    const state = this.uploadState();
    return state.status === 'ready' ? state.document : null;
  });

  upload(file: File): void {
    const problem = pdfProblem(file);
    if (problem) {
      this.uploadState.set({ status: 'failed', message: problem });
      return;
    }
    this.uploadState.set({ status: 'uploading', fileName: file.name });
    this.documentsApi
      .upload(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (document) => this.uploadState.set({ status: 'ready', document }),
        error: (error: unknown) =>
          this.uploadState.set({ status: 'failed', message: readErrorMessage(error) }),
      });
  }

  clear(): void {
    this.uploadState.set({ status: 'idle' });
  }
}
