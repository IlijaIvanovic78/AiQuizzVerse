import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { errorStack } from '../../common/utils/errors';
import { GameSocket } from './matches.types';

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Turns any error thrown by a game handler into a match:error event for that socket. */
@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ws = host.switchToWs();
    const socket = ws.getClient<GameSocket>();
    const data = ws.getData<{ matchId?: unknown } | undefined>();
    socket.emit('match:error', {
      matchId: typeof data?.matchId === 'string' ? data.matchId : '',
      message: this.toMessage(exception),
    });
  }

  private toMessage(exception: unknown): string {
    if (exception instanceof WsException) {
      const error = exception.getError();
      return typeof error === 'string' ? error : UNEXPECTED_ERROR_MESSAGE;
    }
    if (exception instanceof HttpException) {
      return httpExceptionMessage(exception);
    }
    this.logger.error('Unexpected game socket error', errorStack(exception));
    return UNEXPECTED_ERROR_MESSAGE;
  }
}

/** Validation errors arrive as a list of messages; the first one is enough for the player. */
function httpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  const { message } = response as { message?: string | string[] };
  if (Array.isArray(message)) {
    return message[0];
  }
  return message ?? exception.message;
}
