import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { KujiBox } from '../../../../models/game/game-state.model';
import { KujiService } from '../../../../services/kuji/kuji.service';
import { KUJI_TICKETS } from '../../../../utils/catalog.data';

@Component({
  selector: 'app-kuji-box-picker',
  templateUrl: './kuji-box-picker.component.html',
  styleUrl: './kuji-box-picker.component.scss'
})
export class KujiBoxPickerComponent {
  readonly total = KUJI_TICKETS;

  constructor(readonly kuji: KujiService, private readonly ref: MatDialogRef<KujiBoxPickerComponent, number>) {}

  hot(b: KujiBox): string | null {
    const r = this.kuji.remaining(b);
    if (r && this.kuji.tierLeft('A', b).left) { return 'kuji.hotA'; }
    if (r && r <= 8) { return 'kuji.hotLast'; }
    return null;
  }

  choose(i: number): void {
    this.ref.close(i);
  }
}
