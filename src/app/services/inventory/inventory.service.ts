import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AccountSnapshot } from '../../models/api/api.model';
import { InventoryEntry, ValuePoint } from '../../models/user/user.model';
import { CatalogService } from '../catalog/catalog.service';

/**
 * The player's items as last reported by the API.
 * Read-only on the client: items are granted, sold and locked by API calls.
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly subject = new BehaviorSubject<InventoryEntry[]>([]);
  readonly entries$ = this.subject.asObservable();
  private valueHistory: ValuePoint[] = [];

  constructor(private readonly catalog: CatalogService) {}

  get entries(): InventoryEntry[] {
    return this.subject.value;
  }

  /** Collection value over time. Drives the portfolio chart. */
  get history(): ValuePoint[] {
    return this.valueHistory;
  }

  sync(inv: AccountSnapshot['inventory']): void {
    this.valueHistory = inv.history;
    this.subject.next(inv.entries);
  }

  get(uid: number): InventoryEntry | undefined {
    return this.entries.find(e => e.uid === uid);
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
}
