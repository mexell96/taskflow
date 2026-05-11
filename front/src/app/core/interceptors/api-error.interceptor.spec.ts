import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { ApiError } from '@app/core/models/api-error.model';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('passes successful responses through', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    httpClient.get('/api/ping').subscribe((body) => {
      expect(body).toEqual({ ok: true });
    });

    const request = httpMock.expectOne('/api/ping');
    request.flush({ ok: true });

    expect(logSpy.mock.calls.some((call) => String(call[0]).includes('[HTTP] ->'))).toBe(true);
    expect(logSpy.mock.calls.some((call) => String(call[0]).includes('[HTTP] <-'))).toBe(true);
    logSpy.mockRestore();
  });

  it('maps HttpErrorResponse with nested message array to ApiError', () => {
    let received: ApiError | undefined;

    httpClient.get('/api/x').subscribe({
      next: () => {
        throw new Error('expected error');
      },
      error: (error: ApiError) => {
        received = error;
      },
    });

    const request = httpMock.expectOne('/api/x');
    request.flush(
      { message: [{ message: 'nested validation' }] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(received).toEqual({
      status: 400,
      message: 'nested validation',
      url: '/api/x',
    });
  });

  it('falls back to HttpErrorResponse.message when body has no message', () => {
    let received: ApiError | undefined;

    httpClient.get('/api/y').subscribe({
      next: () => {
        throw new Error('expected error');
      },
      error: (error: ApiError) => {
        received = error;
      },
    });

    const request = httpMock.expectOne('/api/y');
    request.flush('plain text body', { status: 500, statusText: 'Server Error' });

    expect(received?.status).toBe(500);
    expect(received?.message).toBeTruthy();
    expect(received?.url).toBe('/api/y');
  });
});
