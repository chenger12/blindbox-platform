import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  /** 0 to 1. */
  @Input() value = 0;
  @Input() tone: 'primary' | 'gold' | 'success' = 'primary';

  get pct(): string {
    return Math.max(0, Math.min(1, this.value)) * 100 + '%';
  }
}
