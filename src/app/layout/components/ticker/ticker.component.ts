import { Component } from '@angular/core';
import { FeedService } from '../../../services/feed/feed.service';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss'
})
export class TickerComponent {
  constructor(readonly feed: FeedService) {}
}
