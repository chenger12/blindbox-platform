import { NavLink } from '../models/layout/nav.model';
import { GameId, NavItemId } from '../models/theme/theme.model';
import { GAME_META } from '../services/game-registry/game-registry.service';

const BASE: Record<'home' | 'play' | 'games' | 'me', Omit<NavLink, 'id'>> = {
  home: { route: '/', labelKey: 'nav.home', exact: true, icon: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>' },
  play: { route: '/boxes', labelKey: 'nav.play', exact: false, icon: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>' },
  games: { route: '/games', labelKey: 'nav.games', exact: false, icon: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>' },
  me: { route: '/me', labelKey: 'nav.me', exact: false, icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>' }
};

/** Resolves a configured nav id to a link. Game ids reuse the game's own route and icon. */
export function navLink(id: NavItemId): NavLink | null {
  if (id in BASE) { return { id, ...BASE[id as keyof typeof BASE] }; }
  const g = GAME_META.find(x => x.id === (id as GameId));
  if (!g) { return null; }
  return {
    id, route: g.route, labelKey: 'nav.' + g.id, exact: false,
    icon: `<g transform="scale(.5)">${g.icon}</g>`
  };
}

export const ALL_NAV_IDS: NavItemId[] = ['home', 'play', 'games', 'me', 'boxes', 'kuji', 'gacha', 'blindBox', 'claw', 'groupPull', 'battles', 'market', 'swap', 'wheel'];
