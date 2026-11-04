import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InventoryEntry, ItemSource, LockReason, ValuePoint } from '../../models/user/user.model';
import { CatalogService } from '../catalog/catalog.service';
import { StorageService } from '../storage/storage.service';

const KEY = 'mb_inventory';
interface InvStore { entries: InventoryEntry[]; nextUid: number; history: ValuePoint[]; }

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private store: InvStore;
  private readonly subject: BehaviorSubject<InventoryEntry[]>;
  readonly entries$;

  constructor(private readonly storage: StorageService, private readonly catalog: CatalogService) {
    this.store = this.storage.get<InvStore>(KEY) ?? { entries: [], nextUid: 1, history: [] };
    this.subject = new BehaviorSubject<InventoryEntry[]>(this.store.entries);
    this.entries$ = this.subject.asObservable();
    if (!this.store.entries.length && !this.store.history.length) { this.seedStarter(); }
  }

  get entries(): InventoryEntry[] {
    return this.subject.value;
  }

  /** Real collection value over time, recorded on every change. Drives the portfolio chart. */
  get history(): ValuePoint[] {
    return this.store.history;
  }

  add(itemId: string, source: ItemSource, tier?: string): number {
    const uid = this.store.nextUid++;
    this.commit([{ uid, itemId, source, tier, createdAt: Date.now() }, ...this.entries]);
    return uid;
  }

  addMany(list: Array<{ itemId: string; tier?: string }>, source: ItemSource): number[] {
    return list.map(x => this.add(x.itemId, source, x.tier));
  }

  remove(uids: number[]): void {
    const set = new Set(uids);
    this.commit(this.entries.filter(e => !set.has(e.uid)));
  }

  get(uid: number): InventoryEntry | undefined {
    return this.entries.find(e => e.uid === uid);
  }

  setLock(uids: number[], reason: LockReason | null): void {
    const set = new Set(uids);
    this.commit(this.entries.map(e => set.has(e.uid) ? { ...e, locked: reason ?? undefined } : e), false);
  }

  available(): InventoryEntry[] {
    return this.entries.filter(e => !e.locked);
  }

  value(entries: InventoryEntry[] = this.entries): number {
    return entries.reduce((s, e) => s + this.catalog.item(e.itemId).value, 0);
  }

  owns(itemId: string): boolean {
    return this.entries.some(e => e.itemId === itemId);
  }

  reset(): void {
    this.storage.remove(KEY);
  }

  private commit(entries: InventoryEntry[], record = true): void {
    this.store.entries = entries;
    if (record) {
      this.store.history = [...this.store.history, { t: Date.now(), v: this.value(entries) }].slice(-240);
    }
    this.storage.set(KEY, this.store);
    this.subject.next(entries);
  }

  private seedStarter(): void {
    ['mf_bu', 'mf_cao', 'pj_mint', 'pn_coco'].forEach((id, i) => this.add(id, 'gift', i === 1 ? 'R' : undefined));
  }
}
