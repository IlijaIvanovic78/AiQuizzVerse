import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { MAX_PDF_MEGABYTES, PDF_MIME_TYPE } from '../create.constants';
import { UploadState } from '../create.types';

// Drop a PDF on the box or click it to pick one. The page uploads the file and passes the
// upload state back in.
@Component({
  selector: 'app-pdf-dropzone',
  imports: [DecimalPipe, PixelIconComponent],
  templateUrl: './pdf-dropzone.component.html',
  styleUrl: './pdf-dropzone.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfDropzoneComponent {
  readonly state = input.required<UploadState>();
  readonly fileChosen = output<File>();
  readonly removed = output<void>();

  protected readonly accept = PDF_MIME_TYPE;
  protected readonly maxMegabytes = MAX_PDF_MEGABYTES;
  protected readonly dragging = signal(false);

  protected readonly document = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.document : null;
  });
  protected readonly uploadingName = computed(() => {
    const state = this.state();
    return state.status === 'uploading' ? state.fileName : null;
  });
  protected readonly problem = computed(() => {
    const state = this.state();
    return state.status === 'failed' ? state.message : null;
  });

  // The browser opens a dropped file in the tab unless dragover is cancelled.
  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) {
      this.fileChosen.emit(file);
    }
  }

  protected pick(fileInput: HTMLInputElement): void {
    const file = fileInput.files?.item(0);
    // Clearing the input lets the player pick the same file again after an error.
    fileInput.value = '';
    if (file) {
      this.fileChosen.emit(file);
    }
  }
}
