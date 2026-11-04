import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth/admin-auth.service';

export const adminAuthGuard: CanActivateFn = () =>
  inject(AdminAuthService).isLoggedIn || inject(Router).createUrlTree(['/admin/login']);
