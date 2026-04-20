import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import type { ApiError } from '@app/core/models/api-error.model';

function toApiError(error: HttpErrorResponse): ApiError {
  const serverMessage =
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error &&
    typeof (error.error as { message?: unknown }).message === 'string'
      ? (error.error as { message: string }).message
      : undefined;

  return {
    status: error.status,
    message: serverMessage ?? error.message ?? 'Unexpected API error',
    url: error.url,
  };
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const startedAt = Date.now();
  console.log(`[HTTP] -> ${req.method} ${req.urlWithParams}`);

  return next(req).pipe(
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
