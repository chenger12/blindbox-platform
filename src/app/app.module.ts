import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutModule } from './layout/layout.module';
import { MockBackendInterceptor } from './services/data/mock-backend.interceptor';
import { I18nService } from './services/i18n/i18n.service';
import { NativeService } from './services/native/native.service';
import { ThemeService } from './services/theme/theme.service';
import { SharedModule } from './shared/shared.module';
import { ServiceWorkerModule } from '@angular/service-worker';

/** Loads the site config (theme, layout, games) and the dictionary before the first render. */
export function bootFactory(theme: ThemeService, i18n: I18nService, native: NativeService): () => Promise<void> {
  return () => theme.load().then(() => {
    const bg = theme.config.colors.background.replace('#', '');
    const lum = parseInt(bg.slice(0, 2), 16) * 0.3 + parseInt(bg.slice(2, 4), 16) * 0.59 + parseInt(bg.slice(4, 6), 16) * 0.11;
    native.init(lum < 128);
    return i18n.init(theme.config.defaultLang);
  });
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, SharedModule, LayoutModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
    { provide: APP_INITIALIZER, useFactory: bootFactory, deps: [ThemeService, I18nService, NativeService], multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
