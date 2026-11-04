import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tier-tag',
  templateUrl: './tier-tag.component.html',
  styleUrl: './tier-tag.component.scss'
})
export class TierTagComponent {
  @Input() tier: string | undefined = 'N';
  @Input() short = false;
}
