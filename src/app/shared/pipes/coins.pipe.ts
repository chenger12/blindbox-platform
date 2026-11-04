import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'coins' })
export class CoinsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return Math.round(value ?? 0).toLocaleString('en-US');
  }
}
