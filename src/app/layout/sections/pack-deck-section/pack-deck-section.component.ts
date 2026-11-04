import { Component } from '@angular/core';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-pack-deck-section',
  templateUrl: './pack-deck-section.component.html',
  styleUrl: './pack-deck-section.component.scss'
})
export class PackDeckSectionComponent {
  constructor(readonly catalog: CatalogService, readonly registry: GameRegistryService) {}
}
