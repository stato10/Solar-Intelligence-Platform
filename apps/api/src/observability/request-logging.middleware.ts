import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

const CORRELATION_ID_HEADER = "x-correlation-id";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HttpRequest");

  use(req: Request, res: Response, next: NextFunction) {
    const incomingId = req.header(CORRELATION_ID_HEADER);
    const correlationId =
      typeof incomingId === "string" && incomingId.trim().length > 0
        ? incomingId.trim()
        : randomUUID();

    const startedAt = Date.now();
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.locals.correlationId = correlationId;

    this.logger.log(
      JSON.stringify({
        event: "request.start",
        correlationId,
        method: req.method,
        path: req.originalUrl
      })
    );

    res.on("finish", () => {
      this.logger.log(
        JSON.stringify({
          event: "request.finish",
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt
        })
      );
    });

    next();
  }
}
