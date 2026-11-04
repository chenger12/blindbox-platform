import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-swap-rules-dialog',
  templateUrl: './swap-rules-dialog.component.html',
  styleUrl: './swap-rules-dialog.component.scss'
})
export class SwapRulesDialogComponent {
  readonly rules = [1, 2, 3, 4, 5];

  constructor(readonly ref: MatDialogRef<SwapRulesDialogComponent>) {}
}
