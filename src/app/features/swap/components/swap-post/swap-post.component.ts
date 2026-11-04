import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SwapPost } from '../../../../models/market/market.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { SWAP_LIFETIME } from '../../../../services/swap/swap.service';

export type PostAction = { type: 'offer' | 'block' | 'unlist'; post: SwapPost } | { type: 'accept' | 'decline'; post: SwapPost; index: number };

@Component({
  selector: 'app-swap-post',
  templateUrl: './swap-post.component.html',
  styleUrl: './swap-post.component.scss'
})
export class SwapPostComponent {
  @Input({ required: true }) post!: SwapPost;
  @Output() action = new EventEmitter<PostAction>();

  constructor(readonly catalog: CatalogService) {}

  get lifeKey(): { key: string; params?: Record<string, number> } {
    const p = this.post;
    if (p.status === 'done') { return { key: 'swap.allTraded' }; }
    if (p.status === 'unlisted') { return { key: 'swap.unlisted' }; }
    const left = Math.max(0, p.createdAt + SWAP_LIFETIME - Date.now());
    const hh = Math.floor(left / 36e5);
    return left ? { key: 'swap.expires', params: { d: Math.floor(hh / 24), h: hh % 24 } } : { key: 'swap.unlisted' };
  }

  get offerDisabled(): boolean {
    const m = this.post.myOffer;
    return (!!m && m.status !== 'declined') || this.post.status !== 'open' || !this.post.give.length;
  }

  get offerLabel(): string {
    const m = this.post.myOffer;
    if (m?.status === 'pending') { return 'swap.offerSent'; }
    if (m?.status === 'accepted') { return 'swap.traded'; }
    return 'swap.makeOffer';
  }

  value(id: string): number {
    return this.catalog.item(id).value;
  }
}
