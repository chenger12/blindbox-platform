import { Component } from '@angular/core';
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

  constructor(readonly daily: DailyService, private readonly toast: ToastService, private readonly fx: FxService) {}

  claim(): void {
    const got = this.daily.checkIn();
    if (got) { this.toast.show('home.checkInToast', { n: got }); this.fx.confetti(60); }
  }
}
