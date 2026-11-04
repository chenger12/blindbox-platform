import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogPayload } from '../../../services/dialog/dialog.service';

export interface OddsRow { tier?: string; labelKey?: string; left?: string; odds: string; }
export interface OddsDialogData { rows: OddsRow[]; headKeys: [string, string, string]; noteKeys: string[]; noteParams?: Record<string, string | number>; }

@Component({
  selector: 'app-odds-dialog',
  templateUrl: './odds-dialog.component.html',
  styleUrl: './odds-dialog.component.scss'
})
export class OddsDialogComponent {
  readonly title: string;
  readonly d: OddsDialogData;

  constructor(@Inject(MAT_DIALOG_DATA) p: DialogPayload<OddsDialogData>, readonly ref: MatDialogRef<OddsDialogComponent>) {
    this.title = p.title ?? '';
    this.d = p.data;
  }
}
