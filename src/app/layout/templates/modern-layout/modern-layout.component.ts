import { Component, Input } from '@angular/core';
import { HomeSectionId } from '../../../models/theme/theme.model';

@Component({
  selector: 'app-modern-layout',
  templateUrl: './modern-layout.component.html',
  styleUrl: './modern-layout.component.scss'
})
export class ModernLayoutComponent {
  @Input() order: HomeSectionId[] = [];
}
