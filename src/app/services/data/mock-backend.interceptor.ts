import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SiteConfig } from '../../models/theme/theme.model';
import { StorageService } from '../storage/storage.service';

export const SITE_CONFIG_KEY = 'mb_site_config';
const DEFAULT_CONFIG_URL = 'assets/config/site-config.json';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

/**
 * Stand-in for the real API while there is no server.
 * GET/PUT /api/site-config persist to localStorage; swap `useMockBackend` off to hit a real backend.
 */
@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  constructor(private readonly storage: StorageService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const prefix = environment.apiUrl + '/';
    if (!environment.useMockBackend || !req.url.startsWith(prefix)) {
      return next.handle(req);
    }
    const path = req.url.slice(prefix.length);
    if (path === 'site-config' && req.method === 'GET') {
      const stored = this.storage.get<SiteConfig>(SITE_CONFIG_KEY);
      return stored ? this.ok(stored) : this.loadDefault(req, next);
    }
    if (path === 'site-config' && req.method === 'PUT') {
      this.storage.set(SITE_CONFIG_KEY, req.body);
      return this.ok(req.body);
    }
    if (path === 'site-config/default' && req.method === 'GET') {
      return this.loadDefault(req, next);
    }
    if (path === 'site-config/reset' && req.method === 'POST') {
      this.storage.remove(SITE_CONFIG_KEY);
      return this.loadDefault(req, next);
    }
    if (path === 'admin/login' && req.method === 'POST') {
      const body = req.body as { username?: string; password?: string };
      if (body?.username === ADMIN_USER && body?.password === ADMIN_PASS) {
        return this.ok({ token: 'mock-' + Date.now().toString(36), username: ADMIN_USER });
      }
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: req.url }));
    }
    return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: req.url }));
  }

  private ok<T>(body: T): Observable<HttpEvent<T>> {
    return of(new HttpResponse<T>({ status: 200, body: structuredClone(body) }));
  }

  private loadDefault(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req.clone({ url: DEFAULT_CONFIG_URL, method: 'GET', body: null })).pipe(
      filter((e): e is HttpResponse<unknown> => e instanceof HttpResponse),
      map(e => e as HttpEvent<unknown>),
      tap({ error: () => undefined })
    );
  }
}
