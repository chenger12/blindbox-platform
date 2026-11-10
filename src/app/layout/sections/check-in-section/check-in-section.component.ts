import { Component } from '@angular/core';
import { AccountService } from '../../../services/account/account.service';
import { DailyService, CHECK_IN_REWARDS } from '../../../services/daily/daily.service';
import { FxService } from '../../../services/fx/fx.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-check-in-section',
  templateUrl: './check-in-section.component.html',
  styleUrl: './check-in-section.component.scss'
})
export class CheckInSectionComponent {
  readonly rewards = CHECK_IN_REWARDS;

  constructor(readonly daily: DailyService, private readonly account: AccountService, private readonly toast: ToastService, private readonly fx: FxService) {}

  async claim(): Promise<void> {
    const r = await this.account.checkIn();
    if (r) { this.toast.show('home.checkInToast', { n: r.coins }); this.fx.confetti(60); }
  }
}
