import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DOCUMENT_NOT_FOUND_MESSAGE,
  MAX_CONTEXT_CHARS,
  MAX_STORED_CHARS,
  MIN_TEXT_CHARS,
  NO_TEXT_MESSAGE,
  PDF_EXTENSION,
} from './documents.constants';
import { DocumentSummary, Lesson } from './documents.types';

const DOCUMENT_SUMMARY_SELECT = {
  id: true,
  fileName: true,
  characterCount: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upload(ownerId: string, file: Express.Multer.File | undefined): Promise<DocumentSummary> {
    if (!file) {
      throw new BadRequestException('Please choose a PDF file to upload.');
    }
    const text = await this.readPdfText(file.buffer);
    if (text.length < MIN_TEXT_CHARS) {
      throw new BadRequestException(NO_TEXT_MESSAGE);
    }

    const content = text.slice(0, MAX_STORED_CHARS);
    return this.prisma.document.create({
      data: {
        ownerId,
        fileName: decodeFileName(file.originalname),
        content,
        characterCount: content.length,
      },
      select: DOCUMENT_SUMMARY_SELECT,
    });
  }

  findAll(ownerId: string): Promise<DocumentSummary[]> {
    return this.prisma.document.findMany({
      where: { ownerId },
      select: DOCUMENT_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(ownerId: string, documentId: string): Promise<void> {
    const { count } = await this.prisma.document.deleteMany({ where: { id: documentId, ownerId } });
    if (count === 0) {
      throw new NotFoundException(DOCUMENT_NOT_FOUND_MESSAGE);
    }
  }

  async getLesson(ownerId: string, documentId: string): Promise<Lesson> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, ownerId },
      select: { fileName: true, content: true },
    });
    if (!document) {
      throw new NotFoundException(DOCUMENT_NOT_FOUND_MESSAGE);
    }
    return {
      name: document.fileName.replace(PDF_EXTENSION, ''),
      context: document.content.slice(0, MAX_CONTEXT_CHARS),
    };
  }

  private async readPdfText(data: Buffer): Promise<string> {
    const parser = new PDFParse({ data: new Uint8Array(data) });
    try {
      // Without an empty joiner every page adds a "-- 1 of 9 --" marker to the text.
      const result = await parser.getText({ pageJoiner: '' });
      return result.text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      this.logger.warn(`Could not read a PDF: ${error instanceof Error ? error.message : error}`);
      throw new BadRequestException("We couldn't open this PDF. Please try another file.");
    } finally {
      await parser.destroy();
    }
  }
}

// Multer reads file names as latin1, so names with letters like č or ž arrive garbled.
function decodeFileName(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf8');
}
