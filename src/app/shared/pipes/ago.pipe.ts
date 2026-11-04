import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../services/i18n/i18n.service';

@Pipe({ name: 'ago', pure: false })
export class AgoPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(ts: number | null | undefined): string {
    const m = Math.floor((Date.now() - (ts ?? Date.now())) / 60000);
    if (m < 1) { return this.i18n.t('time.now'); }
    if (m < 60) { return this.i18n.t('time.minutes', { n: m }); }
    if (m < 1440) { return this.i18n.t('time.hours', { n: Math.floor(m / 60) }); }
    return this.i18n.t('time.days', { n: Math.floor(m / 1440) });
  }
}
