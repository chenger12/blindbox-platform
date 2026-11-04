import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CharacterDef, PrizeForm } from '../../models/catalog/catalog.model';
import { GameId } from '../../models/theme/theme.model';
import { ArtStroke, CHARACTER_IDS, CHARACTERS, charSvg, prizeSvg } from '../../utils/char-art.util';
import { hashSeed } from '../../utils/random.util';
import { CatalogService } from '../catalog/catalog.service';
import { ThemeService } from '../theme/theme.service';

/** Renders the original mascot art as SVG. Strings are generated locally, so they are safe to trust. */
@Injectable({ providedIn: 'root' })
export class ArtService {
  private readonly cache = new Map<string, SafeHtml>();
  private readonly images = new Map<string, HTMLImageElement>();

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly theme: ThemeService,
    private readonly catalog: CatalogService
  ) {}

  item(itemId: string, gameId?: GameId | null): SafeHtml {
    const it = this.catalog.item(itemId);
    return this.prize(it.charId, it.form, gameId);
  }

  prize(charId: string, form: PrizeForm, gameId?: GameId | null): SafeHtml {
    const stroke = this.stroke(gameId);
    const key = `${charId}|${form}|${stroke.outline}|${stroke.width}`;
    let html = this.cache.get(key);
    if (!html) {
      html = this.sanitizer.bypassSecurityTrustHtml(prizeSvg(charId, form, stroke));
      this.cache.set(key, html);
    }
    return html;
  }

  avatar(seed: string | number): SafeHtml {
    const id = CHARACTER_IDS[hashSeed(seed) % CHARACTER_IDS.length];
    const key = 'av|' + id + '|' + this.stroke().outline;
    let html = this.cache.get(key);
    if (!html) {
      html = this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle class="mb-av-bg" cx="50" cy="50" r="50"/><g transform="translate(10,8) scale(.8)">${charSvg(id, this.stroke())}</g></svg>`);
      this.cache.set(key, html);
    }
    return html;
  }

  character(charId: string): CharacterDef {
    return CHARACTERS[charId];
  }

  /** Bitmap of a character for canvas games (claw machine). */
  charImage(charId: string): HTMLImageElement {
    let img = this.images.get(charId);
    if (!img) {
      img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${charSvg(charId, { outline: null, width: 2 })}</svg>`);
      this.images.set(charId, img);
    }
    return img;
  }

  private stroke(gameId?: GameId | null): ArtStroke {
    const p = this.theme.palette(gameId);
    return { outline: p.artOutline, width: p.artStroke };
  }
}
