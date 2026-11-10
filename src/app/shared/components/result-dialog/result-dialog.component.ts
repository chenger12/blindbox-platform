import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResultAction, ResultDialogData } from '../../../models/game/game.model';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { DialogPayload } from '../../../services/dialog/dialog.service';
import { FxService } from '../../../services/fx/fx.service';
import { GachaService } from '../../../services/gacha/gacha.service';
import { ToastService } from '../../../services/toast/toast.service';
import { AccountService } from '../../../services/account/account.service';

import { SELL_RATE } from '../../../utils/game-rules.util';

@Component({
  selector: 'app-result-dialog',
  templateUrl: './result-dialog.component.html',
  styleUrl: './result-dialog.component.scss'
})
export class ResultDialogComponent implements OnInit {
  readonly d: ResultDialogData;
  total = 0;
  sellValue = 0;
  big = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) payload: DialogPayload<ResultDialogData>,
    private readonly ref: MatDialogRef<ResultDialogComponent, ResultAction>,
    private readonly catalog: CatalogService,
    private readonly account: AccountService,
    private readonly toast: ToastService,
    private readonly fx: FxService
  ) {
    this.d = payload.data;
  }

  ngOnInit(): void {
    this.total = this.d.items.reduce((s, x) => s + this.catalog.item(x.itemId).value, 0);
    this.sellValue = Math.round(this.total * SELL_RATE);
    const best = Math.max(...this.d.items.map(x => this.catalog.rarityIndex(this.catalog.item(x.itemId).value)));
    this.big = best >= 3 || this.d.items.some(x => GachaService.isRare(x.tier));
    if (this.big) { this.fx.big(); this.fx.confetti(best >= 4 ? 220 : 140); this.fx.vibrate([60, 40, 120]); }
    else { this.fx.win(); this.fx.confetti(40); }
  }

  get canSell(): boolean {
    return this.d.allowSell !== false && !this.d.trial && this.d.items.every(x => x.uid !== undefined);
  }

  async close(action: ResultAction): Promise<void> {
    this.fx.click();
    if (action === 'sell') {
      const r = await this.account.sell(this.d.items.map(x => x.uid as number));
      if (!r) { return; }
      this.toast.show('result.soldToast', { n: r.n, coins: r.coins });
    }
    this.ref.close(action);
  }
}
