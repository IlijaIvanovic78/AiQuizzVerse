import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('pdf')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a PDF for RAG-based quiz generation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'PDF processed and chunks stored' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadPdf(
    @CurrentUser('userId') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const text = await this.uploadService.parsePDF(file.buffer);

    if (!text || text.trim().length < 50) {
      throw new BadRequestException('PDF contains too little text to generate a quiz');
    }

    const chunks = this.uploadService.chunkText(text);
    const storedCount = await this.uploadService.storeChunks(chunks, file.originalname, userId);

    return {
      fileName: file.originalname,
      chunks: storedCount,
      message: `PDF processed: ${storedCount} chunks stored`,
    };
  }
}
