import { GameId, GameOdds, OddsEntry, SiteConfig } from '../models/theme/theme.model';

/**
 * Built-in odds for each tunable game, shown in the back office when a game has no
 * saved `odds` yet. These mirror the hard-coded rules in game-rules.util.ts and the
 * per-game APIs; the back office lets an operator override them per game.
 */

export type OddsFieldKind = 'weights' | 'tierCounts' | 'pity' | 'gripMin' | 'gripMax' | 'slipChance' | 'returnRate' | 'secretChance';

export interface OddsFieldDef {
  kind: OddsFieldKind;
  /** i18n key for the field label. */
  labelKey: string;
  /** For the single-number fields: shown and edited as a percentage (0-100) instead of 0-1. */
  percent?: boolean;
  min?: number;
  max?: number;
}

export interface GameOddsSpec {
  /** Which editable fields this game exposes, in display order. */
  fields: OddsFieldDef[];
  /** Factory for the built-in defaults. */
  defaults: () => GameOdds;
}

const wheelWeights = (): OddsEntry[] => [
  { key: '0', labelKey: 'admin.odds.wheel.coins20', weight: 22 },
  { key: '1', labelKey: 'admin.odds.wheel.ticket', weight: 14 },
  { key: '2', labelKey: 'admin.odds.wheel.coins50', weight: 18 },
  { key: '3', labelKey: 'admin.odds.wheel.pin', weight: 10 },
  { key: '4', labelKey: 'admin.odds.wheel.hint', weight: 20 },
  { key: '5', labelKey: 'admin.odds.wheel.coins188', weight: 8 },
  { key: '6', labelKey: 'admin.odds.wheel.respin', weight: 6 },
  { key: '7', labelKey: 'admin.odds.wheel.jackpot', weight: 2 }
];

const gachaWeights = (): OddsEntry[] => [
  { key: 'N', labelKey: 'admin.odds.gacha.N', weight: 70 },
  { key: 'R', labelKey: 'admin.odds.gacha.R', weight: 22 },
  { key: 'SR', labelKey: 'admin.odds.gacha.SR', weight: 7 },
  { key: 'SECRET', labelKey: 'admin.odds.gacha.SECRET', weight: 1 }
];

const kujiTierCounts = (): OddsEntry[] => [
  { key: 'A', labelKey: 'admin.odds.kuji.A', weight: 2 },
  { key: 'B', labelKey: 'admin.odds.kuji.B', weight: 3 },
  { key: 'C', labelKey: 'admin.odds.kuji.C', weight: 9 },
  { key: 'D', labelKey: 'admin.odds.kuji.D', weight: 24 },
  { key: 'E', labelKey: 'admin.odds.kuji.E', weight: 42 }
];

/** Games that expose odds tuning, and the shape of each one's controls. */
export const ODDS_SPECS: Partial<Record<GameId, GameOddsSpec>> = {
  kuji: {
    fields: [{ kind: 'tierCounts', labelKey: 'admin.odds.kujiCounts' }],
    defaults: () => ({ tierCounts: kujiTierCounts() })
  },
  wheel: {
    fields: [{ kind: 'weights', labelKey: 'admin.odds.segments' }],
    defaults: () => ({ weights: wheelWeights() })
  },
  gacha: {
    fields: [
      { kind: 'weights', labelKey: 'admin.odds.tiers' },
      { kind: 'pity', labelKey: 'admin.odds.pity', min: 1, max: 200 }
    ],
    defaults: () => ({ weights: gachaWeights(), pity: 30 })
  },
  claw: {
    fields: [
      { kind: 'gripMin', labelKey: 'admin.odds.gripMin', percent: true, min: 0, max: 100 },
      { kind: 'gripMax', labelKey: 'admin.odds.gripMax', percent: true, min: 0, max: 100 },
      { kind: 'slipChance', labelKey: 'admin.odds.slip', percent: true, min: 0, max: 100 },
      { kind: 'pity', labelKey: 'admin.odds.clawPity', min: 1, max: 100 }
    ],
    defaults: () => ({ gripMin: 0.22, gripMax: 0.77, slipChance: 0.4, pity: 8 })
  },
  boxes: {
    // Below ~70% the cheapest boxes can't reach the target (their floor payout is higher), so clamp there.
    fields: [{ kind: 'returnRate', labelKey: 'admin.odds.returnRate', percent: true, min: 70, max: 99 }],
    defaults: () => ({ returnRate: 0.88 })
  },
  blindBox: {
    fields: [{ kind: 'secretChance', labelKey: 'admin.odds.secretChance', percent: true, min: 0, max: 100 }],
    defaults: () => ({ secretChance: 0.3 })
  }
};

/** Games with an odds editor, in a stable order. */
export const ODDS_GAME_IDS = Object.keys(ODDS_SPECS) as GameId[];

export const oddsSpec = (id: GameId): GameOddsSpec | undefined => ODDS_SPECS[id];

/** Current odds for a game: its saved overrides if present, else the built-in defaults. */
export function effectiveOdds(id: GameId, saved?: GameOdds): GameOdds {
  const spec = ODDS_SPECS[id];
  if (!spec) { return {}; }
  return { ...spec.defaults(), ...(saved ?? {}) };
}

/** Effective odds read from a site config — the player-facing odds tables use this. */
export function configOdds(config: SiteConfig | null | undefined, id: GameId): GameOdds {
  return effectiveOdds(id, config?.games.find(g => g.id === id)?.odds);
}
