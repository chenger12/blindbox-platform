import { Component } from '@angular/core';
import { GachaEntry } from '../../../../models/catalog/catalog.model';
import { GroupRoom } from '../../../../models/game/game-state.model';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DailyService } from '../../../../services/daily/daily.service';
import { FxService } from '../../../../services/fx/fx.service';
import { GachaService } from '../../../../services/gacha/gacha.service';
import { GroupPullService } from '../../../../services/group-pull/group-pull.service';
import { InventoryService } from '../../../../services/inventory/inventory.service';
import { ResultService } from '../../../../services/result/result.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { WalletService } from '../../../../services/wallet/wallet.service';
import { BOT_NAMES, GACHA_POOL, GROUP_PULL_BONUS, GROUP_PULL_PRICE } from '../../../../utils/catalog.data';
import { pick, randInt, sleep, weightedPick } from '../../../../utils/random.util';

interface Seat { name: string | null; me: boolean; items: Array<GachaEntry | null>; total: number; state: '' | 'lead' | 'win' | 'lose'; }

@Component({
  selector: 'app-group-pull-page',
  templateUrl: './group-pull-page.component.html',
  styleUrl: './group-pull-page.component.scss'
})
export class GroupPullPageComponent {
  readonly price = GROUP_PULL_PRICE;
  readonly bonus = GROUP_PULL_BONUS;
  rooms: GroupRoom[];
  seats: Seat[] = [];
  arena = false;
  statusKey = '';
  statusParams: Record<string, string | number> = {};
  countdown = '';
  busy = false;

  constructor(
    readonly gp: GroupPullService,
    private readonly wallet: WalletService,
    private readonly inventory: InventoryService,
    private readonly catalog: CatalogService,
    private readonly fx: FxService,
    private readonly results: ResultService,
    private readonly toast: ToastService,
    private readonly daily: DailyService
  ) {
    this.rooms = gp.rooms();
  }

  rare(e: GachaEntry | null): boolean {
    return !!e && GachaService.isRare(e.tier);
  }

  value(e: GachaEntry): number {
    return this.catalog.item(e.itemId).value;
  }

  empties(r: GroupRoom): number[] {
    return Array.from({ length: r.size - r.bots.length }, (_, i) => i);
  }

  async join(room: GroupRoom): Promise<void> {
    if (this.busy || !this.wallet.trySpend(GROUP_PULL_PRICE)) { return; }
    this.busy = true;
    this.arena = true;
    this.daily.track('games');
    this.seats = Array.from({ length: room.size }, (_, i) => ({ name: i ? null : 'me', me: i === 0, items: [null, null, null], total: 0, state: '' }));
    this.statusKey = 'groupPull.waiting';
    for (let i = 1; i < room.size; i++) {
      await sleep(i <= room.bots.length ? 250 : randInt(700, 1300));
      this.seats[i].name = room.bots[i - 1] ?? pick(BOT_NAMES.filter(n => !this.seats.some(s => s.name === n)));
      this.fx.pop();
    }
    this.statusKey = 'groupPull.full';
    for (const t of ['3', '2', '1', 'GO!']) { this.countdown = t; t === 'GO!' ? this.fx.win() : this.fx.tick(); this.fx.vibrate(20); await sleep(650); }
    this.countdown = '';
    for (let r = 0; r < 3; r++) {
      this.statusKey = 'groupPull.round';
      this.statusParams = { n: r + 1 };
      for (const s of this.seats) {
        const e = weightedPick(GACHA_POOL);
        s.items[r] = e;
        s.total += this.value(e);
        if (this.rare(e)) { this.fx.big(); this.fx.confetti(40, undefined, undefined, 'groupPull'); } else { this.fx.pop(); }
        await sleep(320);
      }
      const lead = this.leader();
      this.seats.forEach((s, i) => s.state = i === lead ? 'lead' : '');
      await sleep(1000);
    }
    const win = this.leader();
    this.seats.forEach((s, i) => s.state = i === win ? 'win' : 'lose');
    const mine = this.seats[0].items.filter((x): x is GachaEntry => !!x).map(e => ({ itemId: e.itemId, tier: e.tier }));
    if (win === 0) {
      this.statusKey = 'groupPull.youWin';
      mine.push({ itemId: GROUP_PULL_BONUS, tier: 'SR' });
      this.fx.big();
      this.fx.confetti(200, undefined, undefined, 'groupPull');
      this.daily.track('wins');
    } else {
      this.statusKey = 'groupPull.winner';
      this.statusParams = { user: this.seats[win].name ?? '' };
      this.fx.fail();
    }
    if (this.gp.record(win === 0)) {
      this.wallet.useCard('gachaTickets', 1);
      setTimeout(() => this.toast.show('groupPull.consolation'), 500);
    }
    const uids = mine.map(m => this.inventory.add(m.itemId, 'groupPull', m.tier));
    this.wallet.gainXp(GROUP_PULL_PRICE);
    await sleep(1800);
    const res = await this.results.show({ items: mine.map((m, i) => ({ ...m, uid: uids[i] })), againLabelKey: 'groupPull.again' });
    this.busy = false;
    this.arena = false;
    this.rooms = this.gp.rooms();
    if (res === 'again') { void this.join(this.rooms.find(r => r.size === room.size) ?? this.rooms[0]); }
  }

  private leader(): number {
    return this.seats.reduce((a, s, i) => s.total > this.seats[a].total ? i : a, 0);
  }
}
