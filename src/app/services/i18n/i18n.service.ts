import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { LangCode } from '../../models/theme/theme.model';
import { DataService } from '../data/data.service';
import { StorageService } from '../storage/storage.service';

type Dict = Record<string, string>;
const LANG_KEY = 'mb_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly languages: Array<{ code: LangCode; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' }
  ];
  private readonly langSubject = new BehaviorSubject<LangCode>('en');
  readonly lang$ = this.langSubject.asObservable();
  private dict: Dict = {};
  private readonly cache: Partial<Record<LangCode, Dict>> = {};

  constructor(
    private readonly data: DataService,
    private readonly storage: StorageService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  get lang(): LangCode {
    return this.langSubject.value;
  }

  init(defaultLang: LangCode): Promise<void> {
    const saved = this.storage.get<LangCode>(LANG_KEY);
    return this.use(saved ?? defaultLang, false);
  }

  async use(lang: LangCode, remember = true): Promise<void> {
    if (!this.cache[lang]) {
      const raw = await firstValueFrom(this.data.getAsset<Record<string, unknown>>(`assets/i18n/${lang}.json`)).catch(() => ({}));
      this.cache[lang] = I18nService.flatten(raw);
    }
    this.dict = this.cache[lang] as Dict;
    this.document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    if (remember) { this.storage.set(LANG_KEY, lang); }
    this.langSubject.next(lang);
  }

  t(key: string, params?: Record<string, string | number> | null): string {
    let s = this.dict[key];
    if (s === undefined) { return key; }
    if (params) {
      for (const [k, v] of Object.entries(params)) { s = s.split(`{${k}}`).join(String(v)); }
    }
    return s;
  }

  has(key: string): boolean {
    return this.dict[key] !== undefined;
  }

  private static flatten(obj: Record<string, unknown>, prefix = '', out: Dict = {}): Dict {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') { I18nService.flatten(v as Record<string, unknown>, key, out); }
      else { out[key] = String(v); }
    }
    return out;
  }
}
