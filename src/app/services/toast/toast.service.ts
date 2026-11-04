import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private readonly snack: MatSnackBar, private readonly i18n: I18nService) {}

  show(key: string, params?: Record<string, string | number>, duration = 2600): void {
    this.snack.open(this.i18n.t(key, params), undefined, {
      duration,
      panelClass: 'mb-toast',
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}
