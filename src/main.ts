import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { startViewMode } from './view-mode';

// On a computer the site opens in a phone frame by default (see view-mode.ts).
if (startViewMode()) {
  platformBrowserDynamic().bootstrapModule(AppModule, {
    ngZoneEventCoalescing: true
  })
    .catch(err => console.error(err));
}
