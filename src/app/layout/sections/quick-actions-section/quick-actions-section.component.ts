import { Component } from '@angular/core';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';

@Component({
  selector: 'app-quick-actions-section',
  templateUrl: './quick-actions-section.component.html',
  styleUrl: './quick-actions-section.component.scss'
})
export class QuickActionsSectionComponent {
  constructor(readonly registry: GameRegistryService) {}
}
