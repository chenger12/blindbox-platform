import { Component, Input, OnChanges } from '@angular/core';
import { RarityKey } from '../../../models/catalog/catalog.model';
import { GameId } from '../../../models/theme/theme.model';
import { CatalogService } from '../../../services/catalog/catalog.service';

@Component({
  selector: 'app-item-tile',
  templateUrl: './item-tile.component.html',
  styleUrl: './item-tile.component.scss'
})
export class ItemTileComponent implements OnChanges {
  @Input({ required: true }) itemId!: string;
  @Input() tier: string | undefined;
  @Input() odds: string | null = null;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() showRarity = true;
  @Input() showName = true;
  @Input() showValue = true;
  @Input() selected = false;
  @Input() dim = false;
  @Input() gameId: GameId | null = null;
  rarity: RarityKey = 'common';
  value = 0;

  constructor(private readonly catalog: CatalogService) {}

  ngOnChanges(): void {
    this.value = this.catalog.item(this.itemId).value;
    this.rarity = this.catalog.rarity(this.value);
  }
}
