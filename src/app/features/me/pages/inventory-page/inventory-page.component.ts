import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InventoryEntry, ItemSource } from '../../../../models/user/user.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { AccountService } from '../../../../services/account/account.service';
import { SellDialogComponent, SellDialogData } from '../../../../shared/components/sell-dialog/sell-dialog.component';
import { BLIND_BOX_POOL, BLIND_BOX_SECRET, CLAW_CHARS, GACHA_POOL, KUJI_LAST_ONE, KUJI_PRIZES } from '../../../../utils/catalog.data';

type Sort = 'value' | 'new';
type Filter = 'all' | ItemSource;

interface InvView { list: InventoryEntry[]; total: number; selectedValue: number; }

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent {
  readonly filters: Filter[] = ['all', 'box', 'kuji', 'gacha', 'blindBox', 'claw', 'groupPull', 'battle', 'market', 'swap', 'wheel', 'gift'];
  readonly form: FormGroup<{ sort: FormControl<Sort>; filter: FormControl<Filter> }>;
  readonly view$: Observable<InvView>;
  readonly codex: Array<{ key: string; ids: string[] }> = [
    { key: 'me.codexKuji', ids: [...KUJI_PRIZES.map(p => p.itemId), KUJI_LAST_ONE] },
    { key: 'me.codexGacha', ids: GACHA_POOL.map(p => p.itemId) },
    { key: 'me.codexClaw', ids: CLAW_CHARS.map(k => 'cm_' + k) },
    { key: 'me.codexBlind', ids: [...BLIND_BOX_POOL, BLIND_BOX_SECRET] }
  ];
  selected = new Set<number>();

  constructor(
    fb: FormBuilder,
    readonly inventory: InventoryService,
    private readonly catalog: CatalogService,
    private readonly account: AccountService,
    private readonly dialogs: DialogService,
    private readonly toast: ToastService
  ) {
    this.form = fb.nonNullable.group({ sort: ['value' as Sort], filter: ['all' as Filter] });
    this.view$ = combineLatest([inventory.entries$, this.form.valueChanges.pipe(startWith(this.form.value))]).pipe(map(([entries]) => {
      const { sort, filter } = this.form.getRawValue();
      this.selected = new Set([...this.selected].filter(u => entries.some(e => e.uid === u && !e.locked)));
      const list = entries.filter(e => filter === 'all' || e.source === filter)
        .sort(sort === 'value' ? (a, b) => this.val(b) - this.val(a) : (a, b) => b.createdAt - a.createdAt);
      return { list, total: inventory.value(entries), selectedValue: this.selectedValue() };
    }));
  }

  codexCount(ids: string[]): number {
    return ids.filter(id => this.inventory.owns(id)).length;
  }

  toggle(e: InventoryEntry): void {
    if (e.locked) { this.toast.show(e.locked === 'market' ? 'me.lockedMarket' : 'me.lockedSwap'); return; }
    this.selected.has(e.uid) ? this.selected.delete(e.uid) : this.selected.add(e.uid);
    this.form.updateValueAndValidity();
  }

  selectAll(): void {
    this.inventory.available().forEach(e => this.selected.add(e.uid));
    this.form.updateValueAndValidity();
  }

  clear(): void {
    this.selected.clear();
    this.form.updateValueAndValidity();
  }

  async sell(): Promise<void> {
    const r = await this.account.sell([...this.selected]);
    if (!r) { return; }
    this.selected.clear();
    this.form.updateValueAndValidity();
    this.toast.show('result.soldToast', { n: r.n, coins: r.coins });
  }

  list(): void {
    const uid = [...this.selected][0];
    this.dialogs.open<SellDialogComponent, SellDialogData>(SellDialogComponent, { data: { uid } }).afterClosed().subscribe(() => this.clear());
  }

  ship(): void {
    const n = this.selected.size;
    this.toast.show(n >= 3 ? 'me.shipFree' : 'me.shipMore', { n, more: 3 - n });
  }

  private selectedValue(): number {
    return [...this.selected].reduce((s, u) => s + this.val(this.inventory.get(u)), 0);
  }

  private val(e?: InventoryEntry): number {
    return e ? this.catalog.item(e.itemId).value : 0;
  }
}
