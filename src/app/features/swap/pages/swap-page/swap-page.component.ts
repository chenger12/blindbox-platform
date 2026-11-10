import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PrizeForm } from '../../../../models/catalog/catalog.model';
import { SwapDeal, SwapPost } from '../../../../models/market/market.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { GameRegistryService } from '../../../../services/game-registry/game-registry.service';
import { I18nService } from '../../../../services/i18n/i18n.service';
import { ResultService } from '../../../../services/result/result.service';
import { SwapService } from '../../../../services/swap/swap.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { CreatePostResult, SwapCreateDialogComponent } from '../../components/swap-create-dialog/swap-create-dialog.component';
import { OfferResult, SwapOfferDialogComponent } from '../../components/swap-offer-dialog/swap-offer-dialog.component';
import { PostAction } from '../../components/swap-post/swap-post.component';
import { SwapRulesDialogComponent } from '../../components/swap-rules-dialog/swap-rules-dialog.component';

type Main = 'board' | 'deals';
type Sub = 'new' | 'hot' | 'mine' | 'joined';
type Cat = 'all' | 'plush' | 'figure' | 'pin' | 'paper';
const CAT_FORMS: Record<Exclude<Cat, 'all'>, PrizeForm[]> = {
  plush: ['plush'], figure: ['figure', 'deluxe', 'pajama', 'stand'], pin: ['badge'], paper: ['sticker']
};

@Component({
  selector: 'app-swap-page',
  templateUrl: './swap-page.component.html',
  styleUrl: './swap-page.component.scss'
})
export class SwapPageComponent implements OnInit, OnDestroy {
  readonly subs: Sub[] = ['new', 'hot', 'mine', 'joined'];
  readonly cats: Cat[] = ['all', 'plush', 'figure', 'pin', 'paper'];
  readonly form: FormGroup<{ main: FormControl<Main>; sub: FormControl<Sub>; q: FormControl<string>; cat: FormControl<Cat> }>;
  readonly posts$: Observable<SwapPost[]>;
  readonly deals$: Observable<SwapDeal[]>;
  readonly hasIncoming$: Observable<boolean>;
  private sub?: Subscription;

  constructor(
    fb: FormBuilder,
    readonly swap: SwapService,
    readonly registry: GameRegistryService,
    readonly wallet: WalletService,
    private readonly catalog: CatalogService,
    private readonly dialogs: DialogService,
    private readonly results: ResultService,
    private readonly toast: ToastService,
    private readonly i18n: I18nService
  ) {
    this.form = fb.nonNullable.group({ main: ['board' as Main], sub: ['new' as Sub], q: [''], cat: ['all' as Cat] });
    this.deals$ = swap.state$.pipe(map(s => s.deals));
    this.hasIncoming$ = swap.state$.pipe(map(s => s.posts.some(p => p.mine && p.offers.some(o => o.status === 'pending'))));
    this.posts$ = combineLatest([swap.state$, this.form.valueChanges.pipe(startWith(this.form.value)), i18n.lang$]).pipe(map(([s]) => {
      const { sub, q, cat } = this.form.getRawValue();
      let ps = s.posts.filter(p => !s.blocked.includes(p.author));
      if (sub === 'mine') { ps = ps.filter(p => p.mine); }
      else if (sub === 'joined') { ps = ps.filter(p => p.myOffer); }
      else { ps = ps.filter(p => p.status !== 'unlisted'); }
      if (cat !== 'all') { ps = ps.filter(p => p.give.some(id => CAT_FORMS[cat].includes(this.catalog.item(id).form))); }
      const needle = q.trim().toLowerCase();
      if (needle) {
        ps = ps.filter(p => [p.author, p.note ?? this.i18n.t(p.noteKey ?? ''), ...p.give.map(id => this.catalog.name(id)), ...p.want.map(id => this.catalog.name(id))]
          .join(' ').toLowerCase().includes(needle));
      }
      return [...ps].sort(sub === 'hot' ? (a, b) => b.interested - a.interested : (a, b) => b.createdAt - a.createdAt);
    }));
  }

  ngOnInit(): void {
    if (!this.swap.state.rulesRead) { setTimeout(() => this.rules(), 300); }
    this.sub = this.swap.received$.subscribe(item => void this.results.show({ items: [item], allowSell: false }));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  rules(): void {
    this.dialogs.open(SwapRulesDialogComponent).afterClosed().subscribe(() => this.swap.markRulesRead());
  }

  create(): void {
    this.dialogs.open<SwapCreateDialogComponent, unknown, CreatePostResult>(SwapCreateDialogComponent, { panel: { maxWidth: 520 } }).afterClosed().subscribe(async r => {
      if (r && await this.swap.createPost(r.uids, r.want, r.note)) {
        this.toast.show('swap.listed');
        this.form.patchValue({ main: 'board', sub: 'mine' });
      }
    });
  }

  async onAction(a: PostAction): Promise<void> {
    if (a.type === 'offer') {
      this.dialogs.open<SwapOfferDialogComponent, SwapPost, OfferResult>(SwapOfferDialogComponent, { data: a.post, panel: { maxWidth: 520 } }).afterClosed().subscribe(async r => {
        if (r && await this.swap.makeOffer(a.post.id, r.want, r.uids)) { this.toast.show('swap.offerSentToast', { user: a.post.author }); }
      });
    } else if (a.type === 'block') {
      this.swap.block(a.post.author);
      this.toast.show('swap.blocked', { user: a.post.author });
    } else if (a.type === 'unlist') {
      this.swap.unlist(a.post.id);
      this.toast.show('swap.unlistedToast');
    } else if (a.type === 'accept') {
      const got = await this.swap.acceptOffer(a.post.id, a.index);
      if (got) { void this.results.show({ items: [got], allowSell: false }); }
    } else if (a.type === 'decline') {
      this.swap.declineOffer(a.post.id, a.index);
    }
  }

  trackPost(_: number, p: SwapPost): string {
    return p.id;
  }
}
