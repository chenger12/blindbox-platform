import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GameId } from '../models/theme/theme.model';
import { BattleService } from '../services/battle/battle.service';
import { BlindBoxService } from '../services/blind-box/blind-box.service';
import { ClawService } from '../services/claw/claw.service';
import { GachaService } from '../services/gacha/gacha.service';
import { GroupPullService } from '../services/group-pull/group-pull.service';
import { KujiService } from '../services/kuji/kuji.service';
import { MarketService } from '../services/market/market.service';
import { SwapService } from '../services/swap/swap.service';
import { WheelService } from '../services/wheel/wheel.service';

/** Fetches a game's state from its API before its page opens. */
export const gameStateResolver: ResolveFn<boolean> = async route => {
  const loaders: Partial<Record<GameId, () => Promise<void>>> = {
    kuji: () => inject(KujiService).load(),
    gacha: () => inject(GachaService).load(),
    blindBox: () => inject(BlindBoxService).load(),
    claw: () => inject(ClawService).load(),
    groupPull: () => inject(GroupPullService).load(),
    battles: () => inject(BattleService).load(),
    market: () => inject(MarketService).load(),
    swap: () => inject(SwapService).load(),
    wheel: () => inject(WheelService).load()
  };
  await loaders[route.data['gameId'] as GameId]?.();
  return true;
};
