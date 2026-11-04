export interface Listing {
  id: string;
  itemId: string;
  seller: string;
  price: number;
  createdAt: number;
  mine?: boolean;
  uid?: number;
}

export interface Sale {
  itemId: string;
  price: number;
  createdAt: number;
}

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'void';

export interface SwapOffer {
  id: string;
  from: string;
  itemId: string;
  targetItemId: string;
  targetUid?: number;
  status: OfferStatus;
  createdAt: number;
}

export interface SwapPost {
  id: string;
  author: string;
  mine?: boolean;
  noteKey?: string;
  note?: string;
  give: string[];
  giveUids?: number[];
  want: string[];
  interested: number;
  status: 'open' | 'done' | 'unlisted';
  createdAt: number;
  offers: SwapOffer[];
  myOffer?: { want: string; uids: number[]; itemIds: string[]; status: OfferStatus };
}

export interface SwapDeal {
  a: string;
  b: string;
  itemA: string;
  itemB: string;
  createdAt: number;
}

export interface Battle {
  id: string;
  players: number;
  rounds: string[];
  joined: string[];
  live: boolean;
}
