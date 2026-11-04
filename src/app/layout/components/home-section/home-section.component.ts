import { Component, Input } from '@angular/core';
import { HomeSectionId } from '../../../models/theme/theme.model';

/** Maps a section id from `componentOrder` to its component. Sections hold no layout logic. */
@Component({
  selector: 'app-home-section',
  templateUrl: './home-section.component.html',
  styleUrl: './home-section.component.scss'
})
export class HomeSectionComponent {
  @Input({ required: true }) sectionId!: HomeSectionId;
}
