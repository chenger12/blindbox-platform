import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../services/i18n/i18n.service';

/** Shows "You" (localised) for the current player and the handle for everyone else. */
@Pipe({ name: 'userName', pure: false })
export class UserNamePipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(user: string | null | undefined): string {
    return user === 'me' || user === 'you' ? this.i18n.t('common.you') : user ?? '';
  }
}
