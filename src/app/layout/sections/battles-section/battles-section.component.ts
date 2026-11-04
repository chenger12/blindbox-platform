import { Component } from '@angular/core';
import { BattleService } from '../../../services/battle/battle.service';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-battles-section',
  templateUrl: './battles-section.component.html',
  styleUrl: './battles-section.component.scss'
})
export class BattlesSectionComponent {
  constructor(readonly battles: BattleService, readonly catalog: CatalogService, readonly registry: GameRegistryService) {}
}
