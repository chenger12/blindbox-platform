import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LangCode, SiteConfig } from '../../../../models/theme/theme.model';
import { AdminAuthService } from '../../../../services/admin-auth/admin-auth.service';
import { DataService } from '../../../../services/data/data.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { PREVIEW_MESSAGE, ThemeService } from '../../../../services/theme/theme.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { buildConfigForm, ConfigForm, patchConfigForm } from '../../../../utils/config-form.util';

type Device = 'phone' | 'desktop';

@Component({
  selector: 'app-admin-dashboard-page',
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent implements OnInit, OnDestroy {
  @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;
  readonly form: ConfigForm;
  readonly pages = ['/', '/boxes', '/kuji', '/gacha', '/blind-box', '/claw', '/group-pull', '/battles', '/market', '/swap', '/wheel', '/me'];
  previewUrl: SafeResourceUrl;
  device: Device = 'phone';
  page = '/';
  saving = false;
  private saved: string;
  private sub?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly theme: ThemeService,
    private readonly data: DataService,
    private readonly auth: AdminAuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    readonly i18n: I18nService
  ) {
    this.form = buildConfigForm(fb, theme.config);
    this.saved = JSON.stringify(this.value());
    this.previewUrl = this.urlFor('/');
  }

  get dirty(): boolean {
    return JSON.stringify(this.value()) !== this.saved;
  }

  ngOnInit(): void {
    this.sub = this.form.valueChanges.pipe(debounceTime(120)).subscribe(() => this.pushPreview());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  value(): SiteConfig {
    const v = this.form.getRawValue();
    return ThemeService.normalize({
      ...v,
      games: v.games.map(({ odds, ...g }, i) => odds ? { ...g, order: i + 1, odds } : { ...g, order: i + 1 })
    });
  }

  setLang(code: string): void {
    void this.i18n.use(code as LangCode);
  }

  setPage(p: string): void {
    this.page = p;
    this.previewUrl = this.urlFor(p);
  }

  pushPreview(): void {
    this.frame?.nativeElement.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, config: this.value() }, location.origin);
  }

  async save(): Promise<void> {
    this.saving = true;
    const cfg = this.value();
    try {
      const stored = await firstValueFrom(this.data.put<SiteConfig>('site-config', cfg));
      this.theme.setConfig(stored);
      this.saved = JSON.stringify(cfg);
      this.toast.show('admin.savedToast');
    } catch {
      this.toast.show('admin.saveError');
    }
    this.saving = false;
  }

  discard(): void {
    patchConfigForm(this.fb, this.form, this.theme.config);
    this.form.updateValueAndValidity();
    this.toast.show('admin.discarded');
  }

  async reset(): Promise<void> {
    const def = await firstValueFrom(this.data.post<SiteConfig>('site-config/reset', {}));
    this.theme.setConfig(def);
    patchConfigForm(this.fb, this.form, this.theme.config);
    this.saved = JSON.stringify(this.value());
    this.form.updateValueAndValidity();
    this.toast.show('admin.resetToast');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  private urlFor(path: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${location.href.split('#')[0]}#${path}?preview=1`);
  }
}
