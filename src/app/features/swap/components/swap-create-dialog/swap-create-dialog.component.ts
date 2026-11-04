import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { InventoryEntry } from '../../../../models/user/user.model';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { SWAP_POST_FEE } from '../../../../services/swap/swap.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { ITEMS } from '../../../../utils/catalog.data';

export interface CreatePostResult { uids: number[]; want: string[]; note: string; }

@Component({
  selector: 'app-swap-create-dialog',
  templateUrl: './swap-create-dialog.component.html',
  styleUrl: './swap-create-dialog.component.scss'
})
export class SwapCreateDialogComponent {
  readonly mine: InventoryEntry[];
  readonly wants = ITEMS.map(i => i.id);
  readonly fee = SWAP_POST_FEE;
  readonly form: FormGroup<{ uids: FormControl<number[]>; want: FormControl<string[]>; note: FormControl<string> }>;

  constructor(readonly ref: MatDialogRef<SwapCreateDialogComponent, CreatePostResult>, readonly wallet: WalletService, inventory: InventoryService, fb: FormBuilder) {
    this.mine = inventory.available();
    this.form = fb.nonNullable.group({ uids: [[] as number[], Validators.required], want: [[] as string[]], note: ['', Validators.maxLength(60)] });
  }

  toggleGive(uid: number): void {
    const v = this.form.controls.uids.value;
    this.form.controls.uids.setValue(v.includes(uid) ? v.filter(x => x !== uid) : v.length < 3 ? [...v, uid] : v);
  }

  toggleWant(id: string): void {
    const v = this.form.controls.want.value;
    this.form.controls.want.setValue(v.includes(id) ? v.filter(x => x !== id) : v.length < 3 ? [...v, id] : v);
  }

  submit(): void {
    if (this.form.invalid || !this.form.controls.uids.value.length) { return; }
    const v = this.form.getRawValue();
    this.ref.close({ ...v, note: v.note.trim() });
  }
}
