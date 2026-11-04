import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  CanvasPalette, GameConfig, GameId, SiteConfig, StyleId, StylePreset
} from '../../models/theme/theme.model';
import { findPreset, STYLE_PRESETS } from '../../utils/style-presets';
import { DataService } from '../data/data.service';
import { SITE_CONFIG_KEY } from '../data/mock-backend.interceptor';
import { StorageService } from '../storage/storage.service';

export const ALL_GAME_IDS: GameId[] = ['boxes', 'kuji', 'gacha', 'blindBox', 'claw', 'groupPull', 'battles', 'market', 'swap', 'wheel'];
export const PREVIEW_MESSAGE = 'mb-preview-config';

/**
 * Single source of truth for the site look. Loads SiteConfig (via DataService) at boot,
 * writes CSS custom properties to :root, and re-applies whenever the back office saves.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly configSubject = new BehaviorSubject<SiteConfig | null>(null);
  readonly config$: Observable<SiteConfig> = this.configSubject.pipe(filter((c): c is SiteConfig => !!c));
  readonly isPreview: boolean;

  constructor(
    private readonly data: DataService,
    private readonly storage: StorageService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.isPreview = /[?&]preview=1/.test(location.search + location.hash);
  }

  get config(): SiteConfig {
    return this.configSubject.value as SiteConfig;
  }

  load(): Promise<void> {
    this.storage.changes$.subscribe(key => {
      if (key === SITE_CONFIG_KEY) { void this.reload(); }
    });
    if (this.isPreview) {
      window.addEventListener('message', e => {
        const msg = e.data as { type?: string; config?: SiteConfig };
        if (e.origin === location.origin && msg?.type === PREVIEW_MESSAGE && msg.config) { this.setConfig(msg.config); }
      });
    }
    return this.reload();
  }

  reload(): Promise<void> {
    return firstValueFrom(this.data.get<SiteConfig>('site-config'))
      .then(c => this.setConfig(c))
      .catch(() => this.setConfig(this.configFromPreset(findPreset('arena'))));
  }

  setConfig(config: SiteConfig): void {
    const normalized = ThemeService.normalize(config);
    this.configSubject.next(normalized);
    this.applyToRoot(normalized);
  }

  /** CSS variables derived from a config. Components only ever read these variables. */
  cssVars(c: Pick<SiteConfig, 'colors' | 'button' | 'typography' | 'surface' | 'layout'>): Record<string, string> {
    const k = c.colors;
    return {
      '--color-primary': k.primary,
      '--color-primary-hover': k.primaryHover,
      '--color-secondary': k.secondary,
      '--color-bg': k.background,
      '--color-surface': k.surface,
      '--color-surface-2': k.surface2,
      '--color-border': k.border,
      '--color-text-primary': k.textPrimary,
      '--color-text-secondary': k.textSecondary,
      '--color-on-primary': k.onPrimary,
      '--color-success': k.success,
      '--color-warning': k.warning,
      '--color-error': k.error,
      '--btn-radius': c.button.borderRadius,
      '--btn-font-weight': c.button.fontWeight,
      '--btn-text-transform': c.button.textTransform,
      '--btn-shadow': c.button.shadow,
      '--btn-border': c.button.border,
      '--btn-bg': c.button.background,
      '--font-display': c.typography.display,
      '--font-body': c.typography.body,
      '--title-transform': c.typography.titleTransform,
      '--title-weight': c.typography.titleWeight,
      '--card-radius': c.surface.cardRadius,
      '--card-border': c.surface.cardBorder,
      '--card-shadow': c.surface.cardShadow,
      '--tile-bg': c.surface.tileBackground,
      '--bg-image': c.surface.backgroundImage,
      '--topbar-height': c.layout.topbarHeight,
      '--sidebar-width': c.layout.sidebarWidth
    };
  }

  /** Variables for a game that the admin pinned to a different style; null when it follows the site. */
  scopedVars(gameId: GameId): Record<string, string> | null {
    const game = this.config?.games.find(g => g.id === gameId);
    if (!game?.styleOverride || game.styleOverride === this.config.styleId) { return null; }
    const cfg = this.configFromPreset(findPreset(game.styleOverride));
    return this.cssVars(cfg);
  }

  /** Canvas colours (gacha, claw, wheel, confetti) for the site or a game's override style. */
  palette(gameId?: GameId | null): CanvasPalette {
    const override = gameId ? this.config?.games.find(g => g.id === gameId)?.styleOverride : null;
    return findPreset(override ?? this.config?.styleId).canvas;
  }

  effectiveStyle(gameId?: GameId | null): StyleId {
    const override = gameId ? this.config?.games.find(g => g.id === gameId)?.styleOverride : null;
    return override ?? this.config?.styleId ?? 'arena';
  }

  presets(): StylePreset[] {
    return STYLE_PRESETS;
  }

  /** Turns a preset into a full config, keeping the brand, games and nav choices of `base`. */
  configFromPreset(preset: StylePreset, base?: SiteConfig): SiteConfig {
    const b = base ?? this.config;
    return {
      siteName: b?.siteName ?? 'MENGBOX',
      logoUrl: b?.logoUrl ?? 'assets/brand/logo.svg',
      faviconUrl: b?.faviconUrl ?? 'favicon.ico',
      defaultLang: b?.defaultLang ?? 'en',
      template: preset.template,
      styleId: preset.id,
      colors: { ...preset.colors },
      button: { ...preset.button },
      typography: { ...preset.typography },
      surface: { ...preset.surface },
      layout: {
        navPosition: preset.navPosition,
        desktopNav: preset.desktopNav,
        sidebarWidth: b?.layout.sidebarWidth ?? '232px',
        topbarHeight: b?.layout.topbarHeight ?? '60px',
        footerVisible: b?.layout.footerVisible ?? true,
        bannerPosition: b?.layout.bannerPosition ?? 'top',
        componentOrder: [...preset.componentOrder],
        navItems: [...preset.navItems]
      },
      games: (b?.games ?? []).map(g => ({ ...g }))
    };
  }

  static normalize(c: SiteConfig): SiteConfig {
    const games: GameConfig[] = ALL_GAME_IDS.map((id, i) =>
      c.games?.find(g => g.id === id) ?? { id, enabled: true, order: i + 1, badge: 'none', styleOverride: null });
    const layout = { ...c.layout, desktopNav: c.layout.desktopNav ?? 'top' };
    return { ...c, layout, games: [...games].sort((a, b) => a.order - b.order) };
  }

  private applyToRoot(c: SiteConfig): void {
    const root = this.document.documentElement;
    Object.entries(this.cssVars(c)).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset['style'] = c.styleId;
    root.dataset['template'] = c.template;
    root.dataset['nav'] = c.layout.navPosition;
    this.document.title = c.siteName;
    const icon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon && c.faviconUrl) { icon.href = c.faviconUrl; }
  }
}
