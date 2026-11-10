/**
 * Phone / desktop view switch for wide screens.
 *
 * Phones and tablets (< 1024px) always get the normal app. On a computer the site opens in
 * "phone" view by default: the real app runs inside a phone-sized frame in the middle of the
 * screen. A button switches to the full desktop layout and back; the choice is remembered.
 * `?view=phone` / `?view=desktop` in the link forces a view. The back office is never framed.
 *
 * Runs before Angular. Returns true when the page should start the app itself.
 */

type ViewMode = 'phone' | 'desktop';

const KEY = 'mb_view';
const DESKTOP_MIN = 1024;
const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL = 12;

const LABELS: Record<string, { toDesktop: string; toPhone: string; note: string }> = {
  zh: { toDesktop: '切换到电脑版', toPhone: '切换到手机版', note: '手机版预览 · 用手机打开就是这个样子' },
  ja: { toDesktop: 'PC版に切り替え', toPhone: 'スマホ版に切り替え', note: 'スマホ版プレビュー · スマホで開くとこの表示です' },
  en: { toDesktop: 'Switch to desktop', toPhone: 'Switch to phone', note: 'Phone preview · this is how it looks on a phone' }
};

function labels(): (typeof LABELS)['en'] {
  let lang = '';
  try { lang = JSON.parse(localStorage.getItem('mb_lang') ?? '""'); } catch { /* ignore */ }
  lang ||= navigator.language.slice(0, 2);
  return LABELS[lang] ?? LABELS['en'];
}

function readMode(): ViewMode {
  const param = new URLSearchParams(location.search).get('view');
  if (param === 'phone' || param === 'desktop') {
    saveMode(param);
    const url = new URL(location.href);
    url.searchParams.delete('view');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    return param;
  }
  try { return localStorage.getItem(KEY) === 'desktop' ? 'desktop' : 'phone'; } catch { return 'phone'; }
}

function saveMode(m: ViewMode): void {
  try { localStorage.setItem(KEY, m); } catch { /* private mode */ }
}

function switchTo(m: ViewMode): void {
  saveMode(m);
  location.reload();
}

const isAdmin = (): boolean => location.hash.startsWith('#/admin');

function button(text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.addEventListener('click', onClick);
  Object.assign(b.style, {
    font: '600 14px/1 Inter, system-ui, sans-serif', color: '#fff', cursor: 'pointer',
    background: 'linear-gradient(135deg, #8b5cff, #22c6ff)', border: '0', borderRadius: '999px',
    padding: '12px 20px', boxShadow: '0 6px 20px #0006'
  } satisfies Partial<CSSStyleDeclaration>);
  return b;
}

/** Wide screen, phone view: show the app in a phone frame instead of starting it here. */
function renderPhoneFrame(): void {
  const t = labels();
  document.querySelector('app-root')?.remove();
  Object.assign(document.body.style, {
    margin: '0', minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1c1f45, #0a0d1f 70%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', overflow: 'hidden'
  });

  const device = document.createElement('div');
  Object.assign(device.style, {
    width: `${PHONE_W + BEZEL * 2}px`, height: `${PHONE_H + BEZEL * 2}px`, padding: `${BEZEL}px`, boxSizing: 'border-box',
    borderRadius: '52px', background: '#05060f', boxShadow: '0 0 0 2px #2b2f5c, 0 30px 80px #000a', flex: 'none',
    transformOrigin: 'center center'
  });
  const frame = document.createElement('iframe');
  frame.title = 'MENGBOX';
  frame.src = location.pathname + location.search + location.hash;
  Object.assign(frame.style, { width: `${PHONE_W}px`, height: `${PHONE_H}px`, border: '0', borderRadius: '40px', display: 'block', background: '#0a0d1f' });
  device.appendChild(frame);

  const side = document.createElement('div');
  Object.assign(side.style, { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '220px', color: '#a9b0d6', font: '14px/1.5 Inter, system-ui, sans-serif' });
  const note = document.createElement('p');
  note.textContent = t.note;
  note.style.margin = '0';
  side.append(note, button(t.toDesktop, () => switchTo('desktop')));

  document.body.append(device, side);

  // Fit the phone to the window height.
  const fit = (): void => {
    const scale = Math.min(1, (innerHeight - 40) / (PHONE_H + BEZEL * 2));
    device.style.transform = `scale(${scale})`;
    device.style.margin = `${-((1 - scale) * (PHONE_H + BEZEL * 2)) / 2}px ${-((1 - scale) * (PHONE_W + BEZEL * 2)) / 2}px`;
  };
  fit();
  addEventListener('resize', fit);

  // Keep the address bar on the page shown in the phone, so refresh / share keeps it.
  frame.addEventListener('load', () => {
    const win = frame.contentWindow;
    // Phones have no visible scrollbar.
    const style = frame.contentDocument?.createElement('style');
    if (style) {
      style.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}';
      frame.contentDocument?.head.appendChild(style);
    }
    const sync = (): void => { if (win) { history.replaceState(null, '', location.pathname + location.search + win.location.hash); } };
    sync();
    win?.addEventListener('hashchange', sync);
  });
}

/** Wide screen, desktop view: a small floating button back to the phone view. */
function addPhoneButton(): void {
  const b = button(labels().toPhone, () => switchTo('phone'));
  Object.assign(b.style, { position: 'fixed', right: '20px', bottom: '20px', zIndex: '2000' });
  const show = (): void => { b.style.display = isAdmin() ? 'none' : ''; };
  show();
  addEventListener('hashchange', show);
  document.body.appendChild(b);
}

export function startViewMode(): boolean {
  const framed = window.self !== window.top;
  if (framed || innerWidth < DESKTOP_MIN) { return true; }
  const mode = readMode();
  if (mode === 'phone' && !isAdmin()) { renderPhoneFrame(); return false; }
  addPhoneButton();
  return true;
}
