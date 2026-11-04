import { Component } from '@angular/core';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-games-section',
  templateUrl: './games-section.component.html',
  styleUrl: './games-section.component.scss'
})
export class GamesSectionComponent {
  constructor(readonly registry: GameRegistryService) {}
}
