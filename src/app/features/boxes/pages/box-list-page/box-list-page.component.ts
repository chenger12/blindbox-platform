import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { I18nService } from '../../../../services/i18n/i18n.service';

type Cat = 'all' | 'budget' | 'plush' | 'figures' | 'high';
type Sort = 'featured' | 'low' | 'high';

@Component({
  selector: 'app-box-list-page',
  templateUrl: './box-list-page.component.html',
  styleUrl: './box-list-page.component.scss'
})
export class BoxListPageComponent implements OnInit {
  readonly cats: Cat[] = ['all', 'budget', 'plush', 'figures', 'high'];
  readonly form: FormGroup<{ q: FormControl<string>; cat: FormControl<Cat>; sort: FormControl<Sort> }>;
  boxes$!: Observable<WeightedBox[]>;

  constructor(fb: FormBuilder, private readonly route: ActivatedRoute, private readonly catalog: CatalogService, private readonly i18n: I18nService) {
    this.form = fb.nonNullable.group({ q: [''], cat: ['all' as Cat], sort: ['featured' as Sort] });
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.form.patchValue({ q: qp.get('q') ?? '', cat: (qp.get('cat') as Cat) ?? 'all' });
    this.boxes$ = combineLatest([this.form.valueChanges.pipe(startWith(this.form.value)), this.i18n.lang$]).pipe(map(() => {
      const { q, cat, sort } = this.form.getRawValue();
      const needle = q.trim().toLowerCase();
      let list = this.catalog.boxes.filter(b => cat === 'all' || b.categories.includes(cat));
      if (needle) {
        list = list.filter(b => (this.i18n.t(`box.${b.id}.name`) + ' ' + b.itemIds.map(id => this.catalog.name(id)).join(' ')).toLowerCase().includes(needle));
      }
      if (sort !== 'featured') { list = [...list].sort((a, b) => sort === 'low' ? a.price - b.price : b.price - a.price); }
      return list;
    }));
  }

  setCat(c: Cat): void {
    this.form.controls.cat.setValue(c);
  }
}
