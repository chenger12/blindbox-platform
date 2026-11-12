import { Component, Input } from '@angular/core';
import { GameId, GameOdds, OddsEntry } from '../../../../models/theme/theme.model';
import { GameForm } from '../../../../utils/config-form.util';
import { effectiveOdds, OddsFieldDef, oddsSpec } from '../../../../utils/odds-defaults.util';

/**
 * Back-office odds editor for one game. Edits the row's `odds` form control in place.
 * Weight rows show a live percentage and the total must equal 100% before it can be saved;
 * single-number fields (pity, grip chance, ...) are edited directly.
 */
@Component({
  selector: 'app-odds-editor',
  templateUrl: './odds-editor.component.html',
  styleUrl: './odds-editor.component.scss'
})
export class OddsEditorComponent {
  @Input({ required: true }) game!: GameForm;

  get id(): GameId {
    return this.game.controls.id.value;
  }

  get fields(): OddsFieldDef[] {
    return oddsSpec(this.id)?.fields ?? [];
  }

  /** Current odds: saved overrides merged over the built-in defaults. */
  get odds(): GameOdds {
    return effectiveOdds(this.id, this.game.controls.odds.value ?? undefined);
  }

  get weights(): OddsEntry[] {
    return this.odds.weights ?? [];
  }

  /** Ichiban Kuji ticket counts per tier (quantities, not percentages). */
  get tierCounts(): OddsEntry[] {
    return this.odds.tierCounts ?? [];
  }

  weightTotal(): number {
    return this.weights.reduce((s, w) => s + (Number(w.weight) || 0), 0);
  }

  countTotal(): number {
    return this.tierCounts.reduce((s, w) => s + (Number(w.weight) || 0), 0);
  }

  /** Each weight as a percentage of the total (what the player sees). */
  percentOf(w: OddsEntry): string {
    const total = this.weightTotal();
    return total > 0 ? (w.weight / total * 100).toFixed(1) + '%' : '—';
  }

  /** Each tier's share of a full box, as a percentage. */
  countPercentOf(w: OddsEntry): string {
    const total = this.countTotal();
    return total > 0 ? (w.weight / total * 100).toFixed(1) + '%' : '—';
  }

  setCount(key: string, value: string): void {
    const n = Math.max(0, Math.round(Number(value) || 0));
    this.patch({ tierCounts: this.tierCounts.map(w => w.key === key ? { ...w, weight: n } : w) });
  }

  /** The weights are valid when they add up to 100 (±0.5 for rounding). */
  get weightsBalanced(): boolean {
    if (!this.odds.weights) { return true; }
    return Math.abs(this.weightTotal() - 100) < 0.5;
  }

  number(field: OddsFieldDef): number {
    const v = (this.odds as Record<string, unknown>)[field.kind] as number ?? 0;
    return field.percent ? Math.round(v * 1000) / 10 : v;
  }

  setWeight(key: string, value: string): void {
    const n = Math.max(0, Number(value) || 0);
    this.patch({ weights: this.weights.map(w => w.key === key ? { ...w, weight: n } : w) });
  }

  setNumber(field: OddsFieldDef, value: string): void {
    let n = Number(value);
    if (Number.isNaN(n)) { return; }
    if (field.min !== undefined) { n = Math.max(field.min, n); }
    if (field.max !== undefined) { n = Math.min(field.max, n); }
    this.patch({ [field.kind]: field.percent ? n / 100 : n } as Partial<GameOdds>);
  }

  /** Clears overrides so the game falls back to its built-in defaults. */
  reset(): void {
    this.game.controls.odds.setValue(null);
    this.game.controls.odds.markAsDirty();
  }

  get isDefault(): boolean {
    return this.game.controls.odds.value == null;
  }

  private patch(part: Partial<GameOdds>): void {
    this.game.controls.odds.setValue({ ...this.odds, ...part });
    this.game.controls.odds.markAsDirty();
  }
}
