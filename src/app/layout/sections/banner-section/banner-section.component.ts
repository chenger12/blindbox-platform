import { Component } from '@angular/core';
import { WeightedBox } from '../../../models/catalog/catalog.model';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';
import { KujiService } from '../../../services/kuji/kuji.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { KUJI_TICKETS } from '../../../utils/catalog.data';

@Component({
  selector: 'app-banner-section',
  templateUrl: './banner-section.component.html',
  styleUrl: './banner-section.component.scss'
})
export class BannerSectionComponent {
  readonly featured: WeightedBox;
  readonly tickets = KUJI_TICKETS;

  constructor(
    readonly theme: ThemeService,
    readonly registry: GameRegistryService,
    readonly kuji: KujiService,
    catalog: CatalogService
  ) {
    this.featured = catalog.box('gold') as WeightedBox;
  }

  get showKuji(): boolean {
    return this.theme.config.template === 'classic' && this.registry.isEnabled('kuji');
  }
}
