import { Component } from '@angular/core';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-boxes-section',
  templateUrl: './boxes-section.component.html',
  styleUrl: './boxes-section.component.scss'
})
export class BoxesSectionComponent {
  constructor(readonly catalog: CatalogService, readonly registry: GameRegistryService) {}
}
