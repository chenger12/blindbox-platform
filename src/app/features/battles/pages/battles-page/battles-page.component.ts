import { ChangeDetectorRef, Component, QueryList, ViewChildren } from '@angular/core';
import { BattleRoom } from '../../../../models/game/game-state.model';
import { WeightedBox } from '../../../../models/catalog/catalog.model';
import { BattleResult } from '../../../../models/api/api.model';
import { ApiService } from '../../../../services/api/api.service';
import { BattleService } from '../../../../services/battle/battle.service';
import { CatalogService } from '../../../../services/catalog/catalog.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { FxService } from '../../../../services/fx/fx.service';
import { ResultService } from '../../../../services/result/result.service';
import { ReelComponent } from '../../../../shared/components/reel/reel.component';
import { randInt, sleep } from '../../../../utils/random.util';
import { CreateBattleDialogComponent, CreateBattleResult } from '../../components/create-battle-dialog/create-battle-dialog.component';

interface Player { name: string | null; me: boolean; items: string[]; total: number; state: '' | 'lead' | 'win' | 'lose'; }

@Component({
  selector: 'app-battles-page',
  templateUrl: './battles-page.component.html',
  styleUrl: './battles-page.component.scss'
})
export class BattlesPageComponent {
  @ViewChildren(ReelComponent) reels!: QueryList<ReelComponent>;
  running: BattleRoom | null = null;
  players: Player[] = [];
  round = -1;
  roundBox: WeightedBox | null = null;
  winners: string[] = [];
  statusKey = '';
  statusParams: Record<string, string | number> = {};
  pot = 0;
  finished = false;

  constructor(
    readonly battles: BattleService,
    readonly catalog: CatalogService,
    private readonly api: ApiService,
    private readonly dialogs: DialogService,
    private readonly results: ResultService,
    private readonly fx: FxService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  box(id: string): WeightedBox {
    return this.catalog.box(id) as WeightedBox;
  }

  empties(b: BattleRoom): number[] {
    return Array.from({ length: Math.max(0, b.players - b.joined.length) }, (_, i) => i);
  }

  /** The battles API plays the whole battle (and charges); this page replays it round by round. */
  async join(b: BattleRoom): Promise<void> {
    const r = await this.battles.join(b.id);
    if (r) { void this.run(r, true); }
  }

  async watch(b: BattleRoom): Promise<void> {
    const r = await this.battles.watch(b.id);
    if (r) { void this.run(r, false); }
  }

  create(): void {
    this.dialogs.open<CreateBattleDialogComponent, unknown, CreateBattleResult>(CreateBattleDialogComponent, { panel: { maxWidth: 520 } })
      .afterClosed().subscribe(async r => {
        if (!r) { return; }
        const res = await this.battles.create(r.players, r.rounds);
        if (res) { void this.run(res, true); }
      });
  }

  back(): void {
    this.running = null;
    this.finished = false;
  }

  private async run(res: BattleResult, me: boolean): Promise<void> {
    const b = res.room;
    this.running = b;
    this.finished = false;
    this.round = -1;
    this.roundBox = null;
    this.pot = 0;
    const seated = [...(me ? ['me'] : []), ...b.joined].slice(0, b.players).length;
    this.players = Array.from({ length: b.players }, (_, i) => ({ name: i < seated ? res.names[i] : null, me: me && i === 0, items: [], total: 0, state: '' }));
    this.statusKey = me ? 'battles.waitingPlayers' : 'battles.spectating';
    for (const [i, p] of this.players.entries()) {
      if (!p.name) { await sleep(randInt(600, 1300)); p.name = res.names[i]; this.fx.pop(); }
    }
    for (const t of ['3', '2', '1']) { this.statusKey = ''; this.statusParams = {}; this.countText = t; this.fx.tick(); await sleep(600); }
    this.countText = '';
    for (let r = 0; r < b.rounds.length; r++) {
      this.round = r;
      this.roundBox = this.box(b.rounds[r]);
      this.statusKey = 'battles.roundOf';
      this.statusParams = { n: r + 1, total: b.rounds.length, box: '' };
      this.winners = res.rolls[r];
      this.cdr.detectChanges();
      await sleep(120);
      await Promise.all(this.reels.map((reel, i) => reel.spin(3400 + i * 150, i === 0)));
      this.players.forEach((p, i) => {
        const id = this.winners[i];
        p.items.push(id);
        const v = this.catalog.item(id).value;
        p.total += v;
        this.pot += v;
        if (this.catalog.rarityIndex(v) >= 3) { this.fx.confetti(50, undefined, undefined, 'battles'); }
      });
      const lead = this.leader();
      this.players.forEach((p, i) => p.state = i === lead ? 'lead' : '');
      this.fx.pop();
      await sleep(900);
    }
    const win = res.winner;
    const bonus = res.bonus;
    this.players.forEach((p, i) => p.state = i === win ? 'win' : 'lose');
    this.statusKey = this.players[win].me ? 'battles.youWin' : 'battles.wins';
    this.statusParams = { user: this.players[win].name ?? '', n: bonus };
    this.round = b.rounds.length;
    this.finished = true;
    if (me) {
      this.api.commit();
      if (win === 0) { this.fx.confetti(220, undefined, undefined, 'battles'); this.fx.big(); } else { this.fx.fail(); }
      await sleep(1400);
      await this.results.show({
        items: res.items,
        titleKey: win === 0 ? 'battles.resultWin' : 'battles.resultLose', titleParams: { n: bonus }
      });
    }
  }

  countText = '';

  private leader(): number {
    return this.players.reduce((a, p, i) => p.total > this.players[a].total ? i : a, 0);
  }
}
