import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, MulterModuleOptions } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_PDF_BYTES, PDF_MIME_TYPE } from './documents.constants';
import { DocumentsService } from './documents.service';
import { DocumentSummary } from './documents.types';

const PDF_UPLOAD_OPTIONS: MulterModuleOptions = {
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype !== PDF_MIME_TYPE) {
      callback(new BadRequestException('Only PDF files can be uploaded.'), false);
      return;
    }
    callback(null, true);
  },
};

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', PDF_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  upload(
    @CurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DocumentSummary> {
    return this.documents.upload(userId, file);
  }

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<DocumentSummary[]> {
    return this.documents.findAll(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    return this.documents.remove(userId, documentId);
  }
}
