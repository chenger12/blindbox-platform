import { Component } from '@angular/core';
import { MissionId } from '../../../models/user/user.model';
import { DailyService, MISSIONS } from '../../../services/daily/daily.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-missions-section',
  templateUrl: './missions-section.component.html',
  styleUrl: './missions-section.component.scss'
})
export class MissionsSectionComponent {
  readonly missions = MISSIONS;

  constructor(readonly daily: DailyService, private readonly toast: ToastService) {}

  claim(id: MissionId): void {
    const got = this.daily.claimMission(id);
    if (got) { this.toast.show('home.missionToast', { n: got }); }
  }
}
