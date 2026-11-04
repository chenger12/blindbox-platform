import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GameView } from '../../../models/game/game.model';

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss'
})
export class GameCardComponent {
  @Input({ required: true }) set game(g: GameView) {
    this.view = g;
    this.icon = this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${g.icon}</svg>`);
  }
  @Input() variant: 'card' | 'tile' | 'chip' = 'card';
  view!: GameView;
  icon: SafeHtml = '';

  constructor(private readonly sanitizer: DomSanitizer) {}
}
