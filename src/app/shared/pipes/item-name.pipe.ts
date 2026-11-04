import { Pipe, PipeTransform } from '@angular/core';
import { CatalogService } from '../../services/catalog/catalog.service';

@Pipe({ name: 'itemName', pure: false })
export class ItemNamePipe implements PipeTransform {
  constructor(private readonly catalog: CatalogService) {}

  transform(itemId: string | null | undefined): string {
    return itemId ? this.catalog.name(itemId) : '';
  }
}
