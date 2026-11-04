import { KujiTier } from '../catalog/catalog.model';

export interface KujiLog { user: string; itemId: string; tier: KujiTier; at: number; me?: boolean; }
export interface KujiBox { no: number; remaining: Record<string, number>; log: KujiLog[]; lastOneBy: string | null; }
export interface KujiState { boxes: KujiBox[]; current: number; lockBox: number; lockUntil: number; }

export interface BlindBoxLog { key: string; itemId?: string; ear?: string; }
export interface BlindBoxSlot { itemId: string; sold: 0 | 1 | 2; by?: string; excluded: string[]; xray: boolean; shaken: boolean; log: BlindBoxLog[]; }
export interface BlindBoxState { caseNo: number; slots: BlindBoxSlot[]; selected: number; }

export interface WheelSegment {
  labelKey: string;
  subKey: string;
  weight: number;
  reward: { coins?: number; ticket?: number; hint?: number; item?: boolean; again?: boolean; big?: boolean };
}
export interface WheelLog { index: number; at: number; }

export interface GroupRoom { size: number; bots: string[]; }

export interface BattleRoom { id: string; players: number; rounds: string[]; joined: string[]; live: boolean; }
