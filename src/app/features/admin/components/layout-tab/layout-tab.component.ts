import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { HomeSectionId } from '../../../../models/theme/theme.model';
import { ConfigForm } from '../../../../utils/config-form.util';

export const ALL_SECTIONS: HomeSectionId[] = ['search', 'banner', 'quickActions', 'categories', 'boxes', 'games', 'battles', 'topPulls', 'checkIn', 'missions', 'portfolio', 'packDeck', 'dropCalendar', 'liveDrops'];

@Component({
  selector: 'app-layout-tab',
  templateUrl: './layout-tab.component.html',
  styleUrl: './layout-tab.component.scss'
})
export class LayoutTabComponent {
  @Input({ required: true }) form!: ConfigForm;

  get order(): HomeSectionId[] {
    return this.form.controls.layout.controls.componentOrder.value;
  }

  get hidden(): HomeSectionId[] {
    return ALL_SECTIONS.filter(s => !this.order.includes(s));
  }

  drop(e: CdkDragDrop<unknown>): void {
    const next = [...this.order];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.set(next);
  }

  remove(id: HomeSectionId): void {
    this.set(this.order.filter(x => x !== id));
  }

  add(id: HomeSectionId): void {
    this.set([...this.order, id]);
  }

  private set(v: HomeSectionId[]): void {
    this.form.controls.layout.controls.componentOrder.setValue(v);
  }
}
