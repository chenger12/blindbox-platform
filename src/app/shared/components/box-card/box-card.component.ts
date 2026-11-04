import { Component, Input } from '@angular/core';
import { WeightedBox } from '../../../models/catalog/catalog.model';

@Component({
  selector: 'app-box-card',
  templateUrl: './box-card.component.html',
  styleUrl: './box-card.component.scss'
})
export class BoxCardComponent {
  @Input({ required: true }) box!: WeightedBox;
  @Input() compact = false;
}
