import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';

import type { ApiError } from '@app/core/models/api-error.model';

function rawMessageFromErrorBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  return (body as { message?: unknown }).message;
}

function stringsFromMessagePart(messagePart: unknown): string[] {
  if (typeof messagePart === 'string') {
    return [messagePart];
  }
  if (
    typeof messagePart === 'object' &&
    messagePart !== null &&
    typeof (messagePart as { message?: unknown }).message === 'string'
  ) {
    return [(messagePart as { message: string }).message];
  }
  return [];
}

function normalizeServerMessage(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    return raw;
  }
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.flatMap(stringsFromMessagePart).join(', ');
}

function toApiError(error: HttpErrorResponse): ApiError {
  const serverMessage = normalizeServerMessage(rawMessageFromErrorBody(error.error));

  return {
    status: error.status,
    message: serverMessage ?? error.message ?? 'Unexpected API error',
    url: error.url,
  };
}

export const apiErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const startedAt = Date.now();
  console.log(`[HTTP] -> ${req.method} ${req.urlWithParams}`);

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        console.log(
          `[HTTP] <- ${req.method} ${req.urlWithParams} ${event.status} (${Date.now() - startedAt}ms)`,
        );
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const apiError = toApiError(error);
        console.log(
          `[HTTP] <- ${req.method} ${req.urlWithParams} ${apiError.status} (${Date.now() - startedAt}ms)`,
        );
        return throwError(() => apiError);
      }

      console.log(
        `[HTTP] <- ${req.method} ${req.urlWithParams} unknown error (${Date.now() - startedAt}ms)`,
      );
      return throwError(() => error);
    }),
  );
};
