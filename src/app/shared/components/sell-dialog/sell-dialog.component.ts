import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventoryEntry } from '../../../models/user/user.model';
import { CatalogService } from '../../../services/catalog/catalog.service';
import { DialogPayload } from '../../../services/dialog/dialog.service';
import { InventoryService } from '../../../services/inventory/inventory.service';
import { MARKET_FEE, MarketService } from '../../../services/market/market.service';
import { ToastService } from '../../../services/toast/toast.service';

export interface SellDialogData { uid?: number; }

@Component({
  selector: 'app-sell-dialog',
  templateUrl: './sell-dialog.component.html',
  styleUrl: './sell-dialog.component.scss'
})
export class SellDialogComponent {
  readonly entries: InventoryEntry[];
  readonly form: FormGroup<{ uid: FormControl<number>; price: FormControl<number> }>;

  constructor(
    @Inject(MAT_DIALOG_DATA) p: DialogPayload<SellDialogData>,
    readonly ref: MatDialogRef<SellDialogComponent, boolean>,
    readonly catalog: CatalogService,
    private readonly inventory: InventoryService,
    private readonly market: MarketService,
    private readonly toast: ToastService,
    fb: FormBuilder
  ) {
    this.entries = inventory.available();
    const first = this.entries.find(e => e.uid === p.data?.uid) ?? this.entries[0];
    this.form = fb.nonNullable.group({
      uid: [first?.uid ?? 0, Validators.required],
      price: [this.suggested(first), [Validators.required, Validators.min(1)]]
    });
  }

  get selectedValue(): number {
    const e = this.inventory.get(this.form.controls.uid.value);
    return e ? this.catalog.item(e.itemId).value : 0;
  }

  get receive(): number {
    return Math.round((this.form.controls.price.value || 0) * (1 - MARKET_FEE));
  }

  choose(uid: number): void {
    this.form.patchValue({ uid, price: this.suggested(this.inventory.get(uid)) });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { return; }
    const { uid, price } = this.form.getRawValue();
    const e = this.inventory.get(uid);
    if (!(await this.market.list(uid, price))) { return; }
    if (e) { this.toast.show('market.listedToast', { item: this.catalog.name(e.itemId), price }); }
    this.ref.close(true);
  }

  private suggested(e?: InventoryEntry): number {
    return e ? Math.round(this.catalog.item(e.itemId).value * 1.05) : 1;
  }
}
