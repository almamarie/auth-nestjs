import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { isInstance } from "class-validator";

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  logger: Logger;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService
  ) {
    this.logger = new Logger(CatchEverythingFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let genResponse;

    const env = this.configService.get("NODE_ENV");
    if (env === "development") {
      genResponse = this.genDevelopmentError(exception);
    } else {
      genResponse = this.genProductionError(exception);
    }

    this.logger.error(
      "Error caught by exception filter:",
      genResponse.responseBody
    );

    httpAdapter.reply(
      ctx.getResponse(),
      genResponse.responseBody,
      genResponse.httpStatus
    );
  }

  genProductionError(exception: unknown) {
    const httpStatus = this.getStatus(exception);
    const responseBody = {
      status: httpStatus,
      message: this.getMessage(exception) || "Something Went Very Wrong",
    };

    return { httpStatus, responseBody };
  }

  genDevelopmentError(exception: unknown) {
    let httpStatus: number;
    let responseBody: any;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      responseBody = this.genHttpErrorDevelopment(exception, httpStatus);
    } else if (exception instanceof Error) {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      responseBody = this.genErrorDevelopment(exception, httpStatus);
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      responseBody = this.genUnknownErrorDevelopment(httpStatus);
    }

    return { httpStatus, responseBody };
  }

  genHttpErrorDevelopment(exception: HttpException, httpStatus: number) {
    return {
      status: httpStatus,
      message: this.getMessage(exception),
      error: exception.getResponse(),
      stack: exception.stack,
    };
  }

  genErrorDevelopment(exception: Error, httpStatus: number) {
    return {
      status: httpStatus,
      message: this.getMessage(exception),
      error: exception.name,
      stack: exception.stack,
    };
  }

  genUnknownErrorDevelopment(httpStatus: number) {
    return {
      status: httpStatus,
      error: "Unknown Error",
      message: "An unknown error occurred",
      stack: null,
    };
  }

  getStatus(exception: HttpException | Error | unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    else return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  getMessage(exception: HttpException | Error | unknown): string {
    if (exception instanceof HttpException || exception instanceof Error)
      return exception.message;
    else return "An unknown error occurred";
  }
}
