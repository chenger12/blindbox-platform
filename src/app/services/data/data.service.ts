import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** The only place that talks to HttpClient. Components never call HTTP directly. */
@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}/${path}`);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}/${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}/${path}`, body);
  }

  /** Static files shipped with the app (i18n dictionaries, default config). */
  getAsset<T>(path: string): Observable<T> {
    return this.http.get<T>(path);
  }
}
