import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BattleService } from '../../../../services/battle/battle.service';
import { CatalogService } from '../../../../services/catalog/catalog.service';

export interface CreateBattleResult { players: number; rounds: string[]; }

@Component({
  selector: 'app-create-battle-dialog',
  templateUrl: './create-battle-dialog.component.html',
  styleUrl: './create-battle-dialog.component.scss'
})
export class CreateBattleDialogComponent {
  readonly form: FormGroup<{ players: FormControl<number>; rounds: FormControl<string[]> }>;

  constructor(fb: FormBuilder, readonly catalog: CatalogService, readonly battles: BattleService, private readonly ref: MatDialogRef<CreateBattleDialogComponent, CreateBattleResult>) {
    this.form = fb.nonNullable.group({ players: [2], rounds: [[] as string[], Validators.required] });
  }

  get cost(): number {
    return this.form.controls.rounds.value.reduce((s, id) => s + (this.catalog.box(id)?.price ?? 0), 0);
  }

  add(id: string): void {
    const r = this.form.controls.rounds.value;
    if (r.length < 5) { this.form.controls.rounds.setValue([...r, id]); }
  }

  remove(i: number): void {
    const r = [...this.form.controls.rounds.value];
    r.splice(i, 1);
    this.form.controls.rounds.setValue(r);
  }

  submit(): void {
    if (!this.form.controls.rounds.value.length) { return; }
    this.ref.close(this.form.getRawValue());
  }
}
