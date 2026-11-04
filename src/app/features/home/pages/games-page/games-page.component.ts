import { Component } from '@angular/core';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-games-page',
  templateUrl: './games-page.component.html',
  styleUrl: './games-page.component.scss'
})
export class GamesPageComponent {
  constructor(readonly registry: GameRegistryService) {}
}
