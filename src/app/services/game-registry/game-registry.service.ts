import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameMeta, GameView } from '../../models/game/game.model';
import { GameId } from '../../models/theme/theme.model';
import { ThemeService } from '../theme/theme.service';

export const GAME_META: GameMeta[] = [
  { id: 'boxes', route: '/boxes', accent: '#8b5cff', nameKey: 'game.boxes.name', descKey: 'game.boxes.desc', howKeys: ['game.boxes.how1', 'game.boxes.how2', 'game.boxes.how3'],
    icon: '<path d="M24 7 39 15v17L24 41 9 32V15z"/><path d="M9 15l15 8 15-8M24 23v18"/><path d="M18 11l15 8"/>' },
  { id: 'kuji', route: '/kuji', accent: '#ff4d6d', nameKey: 'game.kuji.name', descKey: 'game.kuji.desc', howKeys: ['game.kuji.how1', 'game.kuji.how2', 'game.kuji.how3'],
    icon: '<path d="M8 12h32v7a4 4 0 0 0 0 8v7H8v-7a4 4 0 0 0 0-8z"/><path d="M29 13v20" stroke-dasharray="3 3"/>' },
  { id: 'gacha', route: '/gacha', accent: '#3d8bff', nameKey: 'game.gacha.name', descKey: 'game.gacha.desc', howKeys: ['game.gacha.how1', 'game.gacha.how2', 'game.gacha.how3'],
    icon: '<circle cx="24" cy="24" r="15"/><path d="M9 24h30"/><circle cx="24" cy="24" r="3.5"/>' },
  { id: 'blindBox', route: '/blind-box', accent: '#a855f7', nameKey: 'game.blindBox.name', descKey: 'game.blindBox.desc', howKeys: ['game.blindBox.how1', 'game.blindBox.how2', 'game.blindBox.how3'],
    icon: '<rect x="8" y="10" width="14" height="14" rx="2"/><rect x="26" y="10" width="14" height="14" rx="2"/><rect x="8" y="28" width="14" height="12" rx="2"/><rect x="26" y="28" width="14" height="12" rx="2"/>' },
  { id: 'claw', route: '/claw', accent: '#21c7a8', nameKey: 'game.claw.name', descKey: 'game.claw.desc', howKeys: ['game.claw.how1', 'game.claw.how2', 'game.claw.how3'],
    icon: '<path d="M24 4v12M16 16h16M18 16c-6 7-4 13 0 16M30 16c6 7 4 13 0 16"/><circle cx="24" cy="37" r="5"/>' },
  { id: 'groupPull', route: '/group-pull', accent: '#f5b400', nameKey: 'game.groupPull.name', descKey: 'game.groupPull.desc', howKeys: ['game.groupPull.how1', 'game.groupPull.how2', 'game.groupPull.how3'],
    icon: '<circle cx="16" cy="18" r="6"/><circle cx="32" cy="18" r="6"/><path d="M6 40c0-7 5-11 10-11s10 4 10 11M22 40c0-7 5-11 10-11s10 4 10 11"/>' },
  { id: 'battles', route: '/battles', accent: '#ff7a3d', nameKey: 'game.battles.name', descKey: 'game.battles.desc', howKeys: ['game.battles.how1', 'game.battles.how2', 'game.battles.how3'],
    icon: '<path d="M10 38 36 10M12 31l5 5M38 38 12 10M36 31l-5 5"/>' },
  { id: 'market', route: '/market', accent: '#2fbf71', nameKey: 'game.market.name', descKey: 'game.market.desc', howKeys: ['game.market.how1', 'game.market.how2', 'game.market.how3'],
    icon: '<path d="M8 18h32l-3 20H11z"/><path d="M17 18v-4a7 7 0 0 1 14 0v4"/>' },
  { id: 'swap', route: '/swap', accent: '#ff6fa5', nameKey: 'game.swap.name', descKey: 'game.swap.desc', howKeys: ['game.swap.how1', 'game.swap.how2', 'game.swap.how3'],
    icon: '<path d="M9 17h27l-6-6M39 31H12l6 6"/>' },
  { id: 'wheel', route: '/wheel', accent: '#d8b45c', nameKey: 'game.wheel.name', descKey: 'game.wheel.desc', howKeys: ['game.wheel.how1', 'game.wheel.how2', 'game.wheel.how3'],
    icon: '<circle cx="24" cy="26" r="15"/><path d="M24 11v30M9 26h30M13.4 15.4l21.2 21.2M34.6 15.4 13.4 36.6"/><path d="M20 4h8l-4 6z"/>' }
];

@Injectable({ providedIn: 'root' })
export class GameRegistryService {
  readonly all$: Observable<GameView[]>;
  readonly enabled$: Observable<GameView[]>;

  constructor(private readonly theme: ThemeService) {
    this.all$ = this.theme.config$.pipe(map(() => this.views()));
    this.enabled$ = this.all$.pipe(map(list => list.filter(g => g.enabled)));
  }

  meta(id: GameId): GameMeta {
    return GAME_META.find(g => g.id === id) ?? GAME_META[0];
  }

  views(): GameView[] {
    const games = this.theme.config?.games ?? [];
    return games.map(g => ({ ...this.meta(g.id), ...g })).sort((a, b) => a.order - b.order);
  }

  isEnabled(id: GameId): boolean {
    return this.theme.config?.games.find(g => g.id === id)?.enabled ?? false;
  }
}
