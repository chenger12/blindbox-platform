import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResultAction, ResultDialogData } from '../../models/game/game.model';
import { ResultDialogComponent } from '../../shared/components/result-dialog/result-dialog.component';
import { DialogService } from '../dialog/dialog.service';

/** Opens the shared "you pulled" dialog and resolves with the button the player chose. */
@Injectable({ providedIn: 'root' })
export class ResultService {
  constructor(private readonly dialogs: DialogService) {}

  show(data: ResultDialogData): Promise<ResultAction> {
    const ref = this.dialogs.open<ResultDialogComponent, ResultDialogData, ResultAction>(ResultDialogComponent, {
      data, panel: { maxWidth: data.items.length > 4 ? 620 : 465 }
    });
    return firstValueFrom(ref.afterClosed()).then(r => r ?? 'close');
  }
}
