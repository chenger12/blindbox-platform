import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { AccountService } from '../../../../services/account/account.service';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { levelNeed, WalletService } from '../../../../services/wallet/wallet.service';

@Component({
  selector: 'app-rewards-page',
  templateUrl: './rewards-page.component.html',
  styleUrl: './rewards-page.component.scss'
})
export class RewardsPageComponent {
  readonly starter: WeightedBox;
  readonly promo: FormGroup<{ code: FormControl<string> }>;
  readonly need = levelNeed;

  constructor(
    fb: FormBuilder,
    readonly wallet: WalletService,
    readonly daily: DailyService,
    readonly registry: GameRegistryService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly account: AccountService,
    catalog: CatalogService
  ) {
    this.starter = catalog.box('starter') as WeightedBox;
    this.promo = fb.nonNullable.group({ code: [''] });
  }

  async claimFree(): Promise<void> {
    const r = await this.account.claimFreeBox();
    if (r) { void this.router.navigate(['/boxes', r.boxId]); }
  }

  async redeem(): Promise<void> {
    const code = this.promo.controls.code.value.trim();
    if (!code) { this.toast.show('rewards.promoEmpty'); return; }
    if (await this.account.redeem(code)) {
      this.toast.show('rewards.promoOk');
      this.promo.reset();
    }
  }
}
