import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { FOREIGN_KEY_VIOLATION, RECORD_NOT_FOUND, UNIQUE_VIOLATION } from './prisma.constants';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const exception = this.toHttpException(error);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.getStatus()).json(exception.getResponse());
  }

  private toHttpException(error: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (error.code) {
      case UNIQUE_VIOLATION:
        return new ConflictException('This already exists.');
      case RECORD_NOT_FOUND:
        return new NotFoundException('We could not find that.');
      case FOREIGN_KEY_VIOLATION:
        return new BadRequestException('This points to something that does not exist.');
      default:
        this.logger.error(`Unhandled database error ${error.code}: ${error.message}`);
        return new InternalServerErrorException('Something went wrong. Please try again.');
    }
  }
}
