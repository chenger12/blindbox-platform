import { BadgeType, GameId, StyleId } from '../theme/theme.model';

export interface GameMeta {
  id: GameId;
  route: string;
  icon: string;
  accent: string;
  nameKey: string;
  descKey: string;
  howKeys: string[];
}

export interface GameView extends GameMeta {
  enabled: boolean;
  order: number;
  badge: BadgeType;
  styleOverride: StyleId | null;
}

export interface ResultItem {
  itemId: string;
  tier?: string;
  uid?: number;
}

export interface ResultDialogData {
  items: ResultItem[];
  trial?: boolean;
  againLabelKey?: string;
  titleKey?: string;
  titleParams?: Record<string, string | number>;
  allowSell?: boolean;
}

export type ResultAction = 'keep' | 'sell' | 'again' | 'real' | 'close';
