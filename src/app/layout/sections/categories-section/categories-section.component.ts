import { Component } from '@angular/core';

@Component({
  selector: 'app-categories-section',
  templateUrl: './categories-section.component.html',
  styleUrl: './categories-section.component.scss'
})
export class CategoriesSectionComponent {
  readonly cats = [
    { id: 'budget', item: 'pn_lan' },
    { id: 'plush', item: 'cm_cao' },
    { id: 'figures', item: 'dx_bo' },
    { id: 'high', item: 'jp_jin' }
  ];
}
