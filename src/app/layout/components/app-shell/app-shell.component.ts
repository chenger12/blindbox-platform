import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { NavLink } from '../../../models/layout/nav.model';
import { GameId, LangCode, SiteConfig } from '../../../models/theme/theme.model';
import { AccountService } from '../../../services/account/account.service';
import { FeedService } from '../../../services/feed/feed.service';
import { FxService } from '../../../services/fx/fx.service';
import { I18nService } from '../../../services/i18n/i18n.service';
import { MarketService } from '../../../services/market/market.service';
import { SwapService } from '../../../services/swap/swap.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { ToastService } from '../../../services/toast/toast.service';
import { WalletService } from '../../../services/wallet/wallet.service';
import { navLink } from '../../../utils/nav-items.util';

interface ShellLink extends NavLink { svg: SafeHtml; }

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent implements OnInit {
  readonly config$: Observable<SiteConfig>;
  readonly links$: Observable<ShellLink[]>;
  readonly bare$: Observable<boolean>;

  constructor(
    readonly theme: ThemeService,
    readonly wallet: WalletService,
    readonly i18n: I18nService,
    readonly fx: FxService,
    private readonly feed: FeedService,
    private readonly market: MarketService,
    private readonly swap: SwapService,
    private readonly toast: ToastService,
    private readonly account: AccountService,
    private readonly sanitizer: DomSanitizer,
    router: Router
  ) {
    this.config$ = theme.config$;
    this.bare$ = router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.startsWith('/admin')),
      startWith(router.url.startsWith('/admin') || location.hash.startsWith('#/admin'))
    );
    this.links$ = combineLatest([theme.config$, i18n.lang$]).pipe(map(([c]) => this.buildLinks(c)));
  }

  ngOnInit(): void {
    this.feed.start();
    this.market.start();
    this.swap.start();
  }

  async topUp(): Promise<void> {
    if (await this.account.topUp()) { this.toast.show('toast.topUp'); }
  }

  setLang(code: string): void {
    void this.i18n.use(code as LangCode);
  }

  private buildLinks(c: SiteConfig): ShellLink[] {
    return c.layout.navItems
      .map(id => navLink(id))
      .filter((l): l is NavLink => !!l && (['home', 'play', 'games', 'me'].includes(l.id)
        ? (l.id !== 'play' || c.games.find(g => g.id === 'boxes')?.enabled !== false)
        : c.games.find(g => g.id === (l.id as GameId))?.enabled === true))
      .map(l => ({ ...l, svg: this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${l.icon}</svg>`) }));
  }
}
