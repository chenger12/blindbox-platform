import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdminSession } from '../../models/user/user.model';
import { DataService } from '../data/data.service';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_admin_session';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  constructor(private readonly data: DataService, private readonly storage: StorageService) {}

  get session(): AdminSession | undefined {
    return this.storage.session<AdminSession>(KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.session;
  }

  login(username: string, password: string): Observable<boolean> {
    return this.data.post<AdminSession>('admin/login', { username, password }).pipe(
      map(s => { this.storage.session(KEY, s); return true; }),
      catchError(() => of(false))
    );
  }

  logout(): void {
    this.storage.session(KEY, null);
  }
}
