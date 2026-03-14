/** Maximum PDF file size in bytes (10 MB) */
export const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;

/** Minimum text length extracted from PDF to be considered valid */
export const MIN_PDF_TEXT_LENGTH = 50;

/** Default chunk size for RAG text splitting (in characters) */
export const DEFAULT_CHUNK_SIZE = 800;

/** Default overlap between chunks (in characters) */
export const DEFAULT_CHUNK_OVERLAP = 200;

/** Number of chunks to embed in a single batch */
export const EMBEDDING_BATCH_SIZE = 10;
