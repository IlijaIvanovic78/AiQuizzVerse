-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop the BYTEA column and recreate as vector(1536)
ALTER TABLE "document_chunks" DROP COLUMN "embedding";
ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(1536) NOT NULL;
