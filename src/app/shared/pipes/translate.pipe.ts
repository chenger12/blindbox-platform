import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../services/i18n/i18n.service';

/** `{{ 'key' | t }}` or `{{ 'key' | t:{ n: 3 } }}`. Impure so it follows language changes. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(key: string | null | undefined, params?: Record<string, string | number> | null): string {
    return key ? this.i18n.t(key, params) : '';
  }
}
