export interface DocumentSummary {
  id: string;
  fileName: string;
  characterCount: number;
  createdAt: Date;
}

export interface Lesson {
  name: string;
  context: string;
}
