import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

/** Thin, crash-proof wrapper over localStorage plus a stream of cross-tab changes. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly changes$ = new Subject<string>();

  constructor(zone: NgZone) {
    try {
      window.addEventListener('storage', e => {
        if (e.key) { zone.run(() => this.changes$.next(e.key as string)); }
      });
    } catch { /* non-browser */ }
  }

  get<T>(key: string, fallback?: T): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch {
      return fallback;
    }
  }

  set(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota or private mode */ }
  }

  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  session<T>(key: string, value?: T | null): T | undefined {
    try {
      if (value === null) { sessionStorage.removeItem(key); return undefined; }
      if (value !== undefined) { sessionStorage.setItem(key, JSON.stringify(value)); return value; }
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : undefined;
    } catch {
      return undefined;
    }
  }
}
