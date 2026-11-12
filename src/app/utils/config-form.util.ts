import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  BadgeType, ButtonStyle, DesktopNav, GameConfig, GameId, GameOdds, HomeSectionId, LangCode, NavItemId, NavPosition, SiteConfig, StyleId, TemplateType
} from '../models/theme/theme.model';

export type GameForm = FormGroup<{
  id: FormControl<GameId>;
  enabled: FormControl<boolean>;
  order: FormControl<number>;
  badge: FormControl<BadgeType>;
  styleOverride: FormControl<StyleId | null>;
  odds: FormControl<GameOdds | null>;
}>;

/** Builds the back-office form that mirrors SiteConfig one-to-one. */
export function buildConfigForm(fb: FormBuilder, c: SiteConfig) {
  const n = fb.nonNullable;
  return n.group({
    siteName: n.control(c.siteName),
    logoUrl: n.control(c.logoUrl),
    faviconUrl: n.control(c.faviconUrl),
    defaultLang: n.control<LangCode>(c.defaultLang),
    template: n.control<TemplateType>(c.template),
    styleId: n.control<StyleId>(c.styleId),
    colors: n.group({ ...c.colors }),
    button: n.group({
      style: n.control<ButtonStyle>(c.button.style),
      borderRadius: n.control(c.button.borderRadius),
      fontWeight: n.control(c.button.fontWeight),
      textTransform: n.control(c.button.textTransform),
      shadow: n.control(c.button.shadow),
      border: n.control(c.button.border),
      background: n.control(c.button.background)
    }),
    typography: n.group({ ...c.typography }),
    surface: n.group({ ...c.surface }),
    layout: n.group({
      navPosition: n.control<NavPosition>(c.layout.navPosition),
      desktopNav: n.control<DesktopNav>(c.layout.desktopNav ?? 'top'),
      sidebarWidth: n.control(c.layout.sidebarWidth),
      topbarHeight: n.control(c.layout.topbarHeight),
      footerVisible: n.control(c.layout.footerVisible),
      bannerPosition: n.control<'top' | 'middle' | 'hidden'>(c.layout.bannerPosition),
      componentOrder: n.control<HomeSectionId[]>([...c.layout.componentOrder]),
      navItems: n.control<NavItemId[]>([...c.layout.navItems])
    }),
    games: fb.array<GameForm>(c.games.map(g => gameGroup(fb, g)))
  });
}

export function gameGroup(fb: FormBuilder, g: GameConfig): GameForm {
  const n = fb.nonNullable;
  return n.group({
    id: n.control<GameId>(g.id),
    enabled: n.control(g.enabled),
    order: n.control(g.order),
    badge: n.control<BadgeType>(g.badge),
    styleOverride: new FormControl<StyleId | null>(g.styleOverride),
    odds: new FormControl<GameOdds | null>(g.odds ?? null)
  });
}

export type ConfigForm = ReturnType<typeof buildConfigForm>;

/** Replaces the whole form value, rebuilding the games array so its order matches. */
export function patchConfigForm(fb: FormBuilder, form: ConfigForm, c: SiteConfig): void {
  const games = form.controls.games as FormArray<GameForm>;
  games.clear({ emitEvent: false });
  c.games.forEach(g => games.push(gameGroup(fb, g), { emitEvent: false }));
  const { games: _ignored, ...rest } = c;
  form.patchValue(rest);
}
