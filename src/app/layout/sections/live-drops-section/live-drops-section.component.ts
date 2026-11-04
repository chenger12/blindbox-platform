import { Component } from '@angular/core';
import { FeedService } from '../../../services/feed/feed.service';

@Component({
  selector: 'app-live-drops-section',
  templateUrl: './live-drops-section.component.html',
  styleUrl: './live-drops-section.component.scss'
})
export class LiveDropsSectionComponent {
  constructor(readonly feed: FeedService) {}

  track(_: number, e: { id: string }): string {
    return e.id;
  }
}
