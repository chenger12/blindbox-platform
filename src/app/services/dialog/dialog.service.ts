import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export interface DialogOptions<D> {
  title?: string;
  data?: D;
  panel?: { maxWidth?: number; panelClass?: string };
  disableClose?: boolean;
}

/** What every dialog component receives through MAT_DIALOG_DATA. */
export interface DialogPayload<D> {
  title?: string;
  data: D;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private readonly dialog: MatDialog) {}

  open<C, D = unknown, R = unknown>(component: ComponentType<C>, options: DialogOptions<D> = {}): MatDialogRef<C, R> {
    const panel = options.panel ?? {};
    return this.dialog.open<C, DialogPayload<D | undefined>, R>(component, {
      data: { title: options.title, data: options.data },
      maxWidth: `${panel.maxWidth ?? 465}px`,
      width: 'calc(100vw - 24px)',
      panelClass: ['mb-dialog', ...(panel.panelClass ? [panel.panelClass] : [])],
      autoFocus: false,
      disableClose: options.disableClose ?? false
    });
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}
