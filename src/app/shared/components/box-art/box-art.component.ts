import { Component, Input } from '@angular/core';
import { WeightedBox } from '../../../models/catalog/catalog.model';

@Component({
  selector: 'app-box-art',
  templateUrl: './box-art.component.html',
  styleUrl: './box-art.component.scss'
})
export class BoxArtComponent {
  @Input({ required: true }) box!: WeightedBox;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
}
