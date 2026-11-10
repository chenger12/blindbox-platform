import { ApiEnvelope } from '../models/api/api.model';
import { GameId, SiteConfig } from '../models/theme/theme.model';
import { accountRoutes } from './account.api';
import { Account, ApiError, db, GameApi, Handler, Routes } from './core';
import { battlesApi } from './games/battles.api';
import { blindBoxApi } from './games/blind-box.api';
import { boxesApi } from './games/boxes.api';
import { clawApi } from './games/claw.api';
import { gachaApi } from './games/gacha.api';
import { groupPullApi } from './games/group-pull.api';
import { kujiApi } from './games/kuji.api';
import { marketApi } from './games/market.api';
import { swapApi } from './games/swap.api';
import { wheelApi } from './games/wheel.api';

export const SITE_CONFIG_KEY = 'mb_site_config';

/** One independent API per game: /api/games/<base>/<action>. */
export const GAME_APIS: GameApi[] = [boxesApi, kujiApi, gachaApi, blindBoxApi, clawApi, groupPullApi, battlesApi, marketApi, swapApi, wheelApi];

export interface ServerResponse { status: number; body: unknown; }

/**
 * Entry point of the in-browser mock server. Routes:
 *   /api/account[/...]           wallet, inventory, daily rewards
 *   /api/games/<game>/<action>   one API per game — answers 403 gameDisabled when the
 *                                back office has switched that game off
 */
export class MockServer {
  /** Shipped default site config, used until the back office saves its own. */
  private defaultConfig: SiteConfig | null = null;

  setDefaultConfig(c: SiteConfig | null): void {
    this.defaultConfig = c;
  }

  handles(path: string): boolean {
    return path === 'account' || path.startsWith('account/') || path.startsWith('games/');
  }

  handle(method: string, path: string, body: unknown): ServerResponse {
    try {
      const handler = this.resolve(method, path);
      const acct = new Account();
      const data = handler({ acct, body: body ?? {} });
      acct.save();
      const envelope: ApiEnvelope<unknown> = { data, account: acct.snapshot(), paid: acct.paid };
      return { status: 200, body: envelope };
    } catch (e) {
      if (e instanceof ApiError) { return { status: e.status, body: { code: e.code } }; }
      console.error('[mock-server]', method, path, e);
      return { status: 500, body: { code: 'serverError' } };
    }
  }

  private resolve(method: string, path: string): Handler {
    if (path === 'account' || path.startsWith('account/')) {
      return this.route(accountRoutes, method, path.slice('account/'.length));
    }
    const [, base, ...rest] = path.split('/');
    const game = GAME_APIS.find(g => g.base === base);
    if (!game) { throw new ApiError(404, 'notFound'); }
    if (!this.enabled(game.id)) { throw new ApiError(403, 'gameDisabled'); }
    return this.route(game.routes, method, rest.join('/'));
  }

  private route(routes: Routes, method: string, action: string): Handler {
    const h = routes[`${method} ${action}`];
    if (!h) { throw new ApiError(404, 'notFound'); }
    return h;
  }

  /** Same switch the back office "Games" tab writes. */
  private enabled(id: GameId): boolean {
    const config = db.get<SiteConfig>(SITE_CONFIG_KEY) ?? this.defaultConfig;
    return config?.games.find(g => g.id === id)?.enabled ?? true;
  }
}

export const mockServer = new MockServer();
