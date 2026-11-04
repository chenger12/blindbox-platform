import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss'
})
export class SectionHeaderComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() eyebrowKey: string | null = null;
  @Input() linkKey: string | null = null;
  @Input() link: string | null = null;
}
