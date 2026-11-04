import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeedEntry } from '../../../models/user/user.model';
import { FeedService } from '../../../services/feed/feed.service';

@Component({
  selector: 'app-top-pulls-section',
  templateUrl: './top-pulls-section.component.html',
  styleUrl: './top-pulls-section.component.scss'
})
export class TopPullsSectionComponent {
  readonly top$: Observable<FeedEntry[]>;

  constructor(feed: FeedService) {
    this.top$ = feed.drops$.pipe(map(() => feed.top(5)));
  }
}
