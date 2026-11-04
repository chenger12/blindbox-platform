import { Component, Input, OnChanges } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { PrizeForm } from '../../../models/catalog/catalog.model';
import { GameId } from '../../../models/theme/theme.model';
import { ArtService } from '../../../services/art/art.service';

@Component({
  selector: 'app-prize-art',
  templateUrl: './prize-art.component.html',
  styleUrl: './prize-art.component.scss'
})
export class PrizeArtComponent implements OnChanges {
  @Input() itemId: string | null = null;
  @Input() charId: string | null = null;
  @Input() form: PrizeForm = 'plain';
  @Input() gameId: GameId | null = null;
  html: SafeHtml = '';

  constructor(private readonly art: ArtService) {}

  ngOnChanges(): void {
    if (this.itemId) { this.html = this.art.item(this.itemId, this.gameId); }
    else if (this.charId) { this.html = this.art.prize(this.charId, this.form, this.gameId); }
  }
}
