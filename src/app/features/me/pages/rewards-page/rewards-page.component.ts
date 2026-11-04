import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { levelNeed, WalletService } from '../../../../services/wallet/wallet.service';
import { PROMO_CODE } from '../../../../utils/catalog.data';

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
    catalog: CatalogService
  ) {
    this.starter = catalog.box('starter') as WeightedBox;
    this.promo = fb.nonNullable.group({ code: [''] });
  }

  claimFree(): void {
    if (this.daily.claimFreeBox()) { void this.router.navigate(['/boxes', 'starter']); }
  }

  redeem(): void {
    const code = this.promo.controls.code.value.trim().toUpperCase();
    if (!code) { this.toast.show('rewards.promoEmpty'); return; }
    if (code === PROMO_CODE && !this.wallet.state.promoUsed) {
      this.wallet.patch({ promoUsed: true });
      this.wallet.add(200);
      this.toast.show('rewards.promoOk');
      this.promo.reset();
    } else {
      this.toast.show('rewards.promoBad');
    }
  }
}
