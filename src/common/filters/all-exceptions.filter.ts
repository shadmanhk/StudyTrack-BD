
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        message = responseBody.message ?? exception.message;
        error = responseBody.error ?? exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      const databaseError = exception as QueryFailedError & {
        driverError?: {
          code?: string;
          message?: string;
        };
      };

      const databaseCode = databaseError.driverError?.code;
      const databaseMessage = databaseError.driverError?.message;

      // Log database details in the server terminal for debugging.
      // Do not expose SQL details or database messages in API responses.
      this.logger.error(
        `Database error: Code=${databaseCode ?? 'UNKNOWN'}, Message=${databaseMessage ?? 'Unknown database error'}`,
        exception.stack,
      );

      if (databaseCode === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'A record with this information already exists';
        error = 'Conflict';
      } else if (databaseCode === '23503') {
        statusCode = HttpStatus.CONFLICT;
        message = 'This record is referenced by another record';
        error = 'Conflict';
      } else if (
        databaseCode === '23502' ||
        databaseCode === '23514'
      ) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'The submitted data violates a database constraint';
        error = 'Bad Request';
      }
    } else {
      this.logger.error(
        exception instanceof Error
          ? exception.message
          : 'Unknown server error',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
    });
  }
}
