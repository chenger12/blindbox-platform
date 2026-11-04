import { Component } from '@angular/core';
import { ThemeService } from '../../../services/theme/theme.service';

/** Picks the page template the admin selected: modern, classic or customise. */
@Component({
  selector: 'app-template-resolver',
  templateUrl: './template-resolver.component.html',
  styleUrl: './template-resolver.component.scss'
})
export class TemplateResolverComponent {
  constructor(readonly theme: ThemeService) {}
}
