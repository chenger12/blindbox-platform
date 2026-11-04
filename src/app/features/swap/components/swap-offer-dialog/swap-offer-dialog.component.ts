import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SwapPost } from '../../../../models/market/market.model';
import { InventoryEntry } from '../../../../models/user/user.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DialogPayload } from '../../../../services/dialog/dialog.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';

export interface OfferResult { want: string; uids: number[]; }

@Component({
  selector: 'app-swap-offer-dialog',
  templateUrl: './swap-offer-dialog.component.html',
  styleUrl: './swap-offer-dialog.component.scss'
})
export class SwapOfferDialogComponent {
  readonly post: SwapPost;
  readonly mine: InventoryEntry[];
  readonly form: FormGroup<{ want: FormControl<string>; uids: FormControl<number[]> }>;

  constructor(
    @Inject(MAT_DIALOG_DATA) p: DialogPayload<SwapPost>,
    readonly ref: MatDialogRef<SwapOfferDialogComponent, OfferResult>,
    private readonly catalog: CatalogService,
    inventory: InventoryService,
    fb: FormBuilder
  ) {
    this.post = p.data;
    this.mine = inventory.available();
    this.form = fb.nonNullable.group({ want: [this.post.give[0]], uids: [[] as number[], Validators.required] });
  }

  get sum(): number {
    return this.form.controls.uids.value.reduce((s, u) => s + this.catalog.item(this.mine.find(e => e.uid === u)?.itemId ?? '').value, 0);
  }

  get wantValue(): number {
    return this.catalog.item(this.form.controls.want.value).value;
  }

  toggle(uid: number): void {
    const v = this.form.controls.uids.value;
    if (v.includes(uid)) { this.form.controls.uids.setValue(v.filter(x => x !== uid)); }
    else if (v.length < 3) { this.form.controls.uids.setValue([...v, uid]); }
  }

  submit(): void {
    if (!this.form.controls.uids.value.length) { return; }
    this.ref.close(this.form.getRawValue());
  }
}
