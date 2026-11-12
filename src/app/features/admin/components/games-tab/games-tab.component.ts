import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BadgeType, GameId, StyleRegion } from '../../../../models/theme/theme.model';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';
import { ConfigForm } from '../../../../utils/config-form.util';
import { oddsSpec } from '../../../../utils/odds-defaults.util';
import { STYLE_PRESETS, STYLE_REGIONS } from '../../../../utils/style-presets';

@Component({
  selector: 'app-games-tab',
  templateUrl: './games-tab.component.html',
  styleUrl: './games-tab.component.scss'
})
export class GamesTabComponent {
  @Input({ required: true }) form!: ConfigForm;
  readonly badges: BadgeType[] = ['none', 'new', 'hot', 'free'];
  readonly regions: StyleRegion[] = STYLE_REGIONS;
  readonly presets = STYLE_PRESETS;
  private readonly icons = new Map<GameId, SafeHtml>();
  /** Id of the game whose odds panel is open, if any. */
  openOdds: GameId | null = null;

  constructor(private readonly registry: GameRegistryService, private readonly sanitizer: DomSanitizer) {}

  hasOdds(id: GameId): boolean {
    return !!oddsSpec(id);
  }

  toggleOdds(id: GameId): void {
    this.openOdds = this.openOdds === id ? null : id;
  }

  get games() {
    return this.form.controls.games;
  }

  meta(id: GameId) {
    return this.registry.meta(id);
  }

  icon(id: GameId): SafeHtml {
    let s = this.icons.get(id);
    if (!s) {
      s = this.sanitizer.bypassSecurityTrustHtml(`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${this.meta(id).icon}</svg>`);
      this.icons.set(id, s);
    }
    return s;
  }

  presetsIn(r: StyleRegion) {
    return this.presets.filter(p => p.region === r);
  }

  drop(e: CdkDragDrop<unknown>): void {
    const ctrls = [...this.games.controls];
    moveItemInArray(ctrls, e.previousIndex, e.currentIndex);
    this.games.clear({ emitEvent: false });
    ctrls.forEach((c, i) => { c.controls.order.setValue(i + 1, { emitEvent: false }); this.games.push(c, { emitEvent: false }); });
    this.games.updateValueAndValidity();
  }

  setAll(enabled: boolean): void {
    this.games.controls.forEach(c => c.controls.enabled.setValue(enabled));
  }
}
