import { Component } from '@angular/core';
import { MissionId } from '../../../models/user/user.model';
import { AccountService } from '../../../services/account/account.service';
import { DailyService, MISSIONS } from '../../../services/daily/daily.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-missions-section',
  templateUrl: './missions-section.component.html',
  styleUrl: './missions-section.component.scss'
})
export class MissionsSectionComponent {
  readonly missions = MISSIONS;

  constructor(readonly daily: DailyService, private readonly account: AccountService, private readonly toast: ToastService) {}

  async claim(id: MissionId): Promise<void> {
    const r = await this.account.claimMission(id);
    if (r) { this.toast.show('home.missionToast', { n: r.coins }); }
  }
}
