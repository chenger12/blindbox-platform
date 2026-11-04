import { Component, Input } from '@angular/core';
import { HomeSectionId } from '../../../models/theme/theme.model';

const FULL: HomeSectionId[] = ['search', 'banner', 'boxes', 'games', 'packDeck', 'liveDrops', 'categories', 'quickActions', 'dropCalendar'];

/** Free arrangement: the admin's order flows into a two-column grid; wide sections span both. */
@Component({
  selector: 'app-customise-layout',
  templateUrl: './customise-layout.component.html',
  styleUrl: './customise-layout.component.scss'
})
export class CustomiseLayoutComponent {
  @Input() order: HomeSectionId[] = [];

  isFull(id: HomeSectionId): boolean {
    return FULL.includes(id);
  }
}
