import { Component, Input } from '@angular/core';
import { HomeSectionId } from '../../../models/theme/theme.model';

@Component({
  selector: 'app-classic-layout',
  templateUrl: './classic-layout.component.html',
  styleUrl: './classic-layout.component.scss'
})
export class ClassicLayoutComponent {
  @Input() order: HomeSectionId[] = [];
}
