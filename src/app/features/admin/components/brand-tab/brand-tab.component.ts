import { Component, Input } from '@angular/core';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { ConfigForm } from '../../../../utils/config-form.util';

@Component({
  selector: 'app-brand-tab',
  templateUrl: './brand-tab.component.html',
  styleUrl: './brand-tab.component.scss'
})
export class BrandTabComponent {
  @Input({ required: true }) form!: ConfigForm;

  constructor(readonly i18n: I18nService) {}
}
