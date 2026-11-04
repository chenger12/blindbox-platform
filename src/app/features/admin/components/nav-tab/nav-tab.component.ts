import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { NavItemId } from '../../../../models/theme/theme.model';
import { ConfigForm } from '../../../../utils/config-form.util';
import { ALL_NAV_IDS } from '../../../../utils/nav-items.util';

@Component({
  selector: 'app-nav-tab',
  templateUrl: './nav-tab.component.html',
  styleUrl: './nav-tab.component.scss'
})
export class NavTabComponent {
  @Input({ required: true }) form!: ConfigForm;

  get items(): NavItemId[] {
    return this.form.controls.layout.controls.navItems.value;
  }

  get unused(): NavItemId[] {
    return ALL_NAV_IDS.filter(i => !this.items.includes(i));
  }

  disabledGame(id: NavItemId): boolean {
    const g = this.form.controls.games.controls.find(c => c.controls.id.value === id);
    return !!g && !g.controls.enabled.value;
  }

  drop(e: CdkDragDrop<unknown>): void {
    const next = [...this.items];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.set(next);
  }

  remove(id: NavItemId): void { this.set(this.items.filter(x => x !== id)); }
  add(id: NavItemId): void { this.set([...this.items, id]); }

  private set(v: NavItemId[]): void {
    this.form.controls.layout.controls.navItems.setValue(v);
  }
}
