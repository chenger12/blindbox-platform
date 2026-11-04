import { CharacterDef, PrizeForm } from '../models/catalog/catalog.model';

/** Original mascot cast. Names are localised through i18n keys `char.<id>`. */
export const CHARACTERS: Record<string, CharacterDef> = {
  jin: { id: 'jin', kind: 'bear', body: '#e7c46a', shade: '#8f6f22', eyes: 'shine', accessory: 'crown' },
  ye: { id: 'ye', kind: 'cat', body: '#3e4a68', shade: '#1c2338', eyes: 'shine', accessory: 'moon' },
  cao: { id: 'cao', kind: 'bunny', body: '#e6a6a0', shade: '#9a5953', eyes: 'line', accessory: 'bow' },
  bo: { id: 'bo', kind: 'ghost', body: '#dcd9e6', shade: '#85819c', eyes: 'dot', accessory: 'none' },
  gua: { id: 'gua', kind: 'frog', body: '#a3b98d', shade: '#5b7349', eyes: 'dot', accessory: 'leaf' },
  bu: { id: 'bu', kind: 'chick', body: '#efdfae', shade: '#a98d45', eyes: 'dot', accessory: 'none' },
  mint: { id: 'mint', kind: 'bear', body: '#a8d2c5', shade: '#548a7a', eyes: 'line', accessory: 'none' },
  coco: { id: 'coco', kind: 'cat', body: '#a57b5d', shade: '#5e412c', eyes: 'dot', accessory: 'none' },
  lan: { id: 'lan', kind: 'bunny', body: '#93a8c8', shade: '#465c80', eyes: 'dot', accessory: 'star' },
  ying: { id: 'ying', kind: 'ghost', body: '#d99393', shade: '#8f4a4a', eyes: 'line', accessory: 'cherry' },
  ju: { id: 'ju', kind: 'cat', body: '#e0a46e', shade: '#965f2e', eyes: 'line', accessory: 'leaf' },
  yun: { id: 'yun', kind: 'bear', body: '#f4f3ee', shade: '#8f8f88', eyes: 'dot', accessory: 'none' },
  uni: { id: 'uni', kind: 'uni', body: '#ffffff', shade: '#857fae', eyes: 'shine', accessory: 'none' }
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);

export interface ArtStroke { outline: string | null; width: number; }

let gradientSeq = 0;

export function charSvg(id: string, stroke: ArtStroke): string {
  const c = CHARACTERS[id] ?? CHARACTERS['jin'];
  const d = c.shade;
  const K = '#161616';
  let s = '';
  let fill = c.body;
  if (c.kind === 'uni') {
    const gid = 'mbg' + (++gradientSeq);
    s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cdf4ff"/><stop offset=".35" stop-color="#f6d6ff"/><stop offset=".65" stop-color="#fff3c4"/><stop offset="1" stop-color="#d2ffe6"/></linearGradient></defs>`;
    fill = `url(#${gid})`;
  }
  const st = `stroke="${stroke.outline || d}" stroke-width="${stroke.width}"`;
  if (c.kind === 'cat') {
    s += `<path d="M20 46 L27 13 L47 33Z" fill="${fill}" ${st} stroke-linejoin="round"/><path d="M80 46 L73 13 L53 33Z" fill="${fill}" ${st} stroke-linejoin="round"/><path d="M27 36 L29 22 L38 32Z" fill="${d}" opacity=".25"/><path d="M73 36 L71 22 L62 32Z" fill="${d}" opacity=".25"/>`;
  }
  if (c.kind === 'bear') {
    s += `<circle cx="26" cy="31" r="12" fill="${fill}" ${st}/><circle cx="74" cy="31" r="12" fill="${fill}" ${st}/><circle cx="26" cy="31" r="5.5" fill="${d}" opacity=".25"/><circle cx="74" cy="31" r="5.5" fill="${d}" opacity=".25"/>`;
  }
  if (c.kind === 'bunny' || c.kind === 'uni') {
    s += `<ellipse cx="37" cy="19" rx="8" ry="20" transform="rotate(-10 37 19)" fill="${fill}" ${st}/><ellipse cx="63" cy="19" rx="8" ry="20" transform="rotate(10 63 19)" fill="${fill}" ${st}/><ellipse cx="37" cy="20" rx="3.2" ry="12" transform="rotate(-10 37 20)" fill="${d}" opacity=".22"/><ellipse cx="63" cy="20" rx="3.2" ry="12" transform="rotate(10 63 20)" fill="${d}" opacity=".22"/>`;
  }
  if (c.kind === 'uni') {
    s += `<path d="M50 4 L43 30 L57 30Z" fill="#e7c46a" stroke="#8f6f22" stroke-width="1.6" stroke-linejoin="round"/><path d="M46 20 L54 17 M45 25 L55 22" stroke="#8f6f22" stroke-width="1.2"/>`;
  }
  if (c.kind === 'frog') {
    s += `<circle cx="33" cy="33" r="13" fill="${fill}" ${st}/><circle cx="67" cy="33" r="13" fill="${fill}" ${st}/>`;
  }
  if (c.kind === 'chick') {
    s += `<path d="M48 30 q-8 -16 3 -20 q-3 9 3 14 q2 -8 9 -7 q-6 5 -7 13z" fill="${c.body}" ${st}/>`;
  }
  if (c.kind === 'ghost') {
    s += `<path d="M15 60 Q15 21 50 21 Q85 21 85 60 L85 87 Q78 79 72 88 Q66 79 61 88 Q55 79 50 88 Q44 79 39 88 Q33 79 28 88 Q22 79 15 87Z" fill="${fill}" ${st} stroke-linejoin="round"/>`;
  } else {
    s += `<ellipse cx="50" cy="61" rx="36" ry="30" fill="${fill}" ${st}/>`;
  }
  s += `<ellipse cx="36" cy="44" rx="11" ry="5" fill="#fff" opacity=".3" transform="rotate(-24 36 44)"/>`;
  const eyes: Array<[number, number]> = c.kind === 'frog' ? [[33, 33], [67, 33]] : [[39, 58], [61, 58]];
  if (c.kind === 'frog') { eyes.forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="7" fill="#f4f3ee"/>`); }
  eyes.forEach(([x, y]) => {
    if (c.eyes === 'line') { s += `<path d="M${x - 4.5} ${y} h9" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`; }
    else if (c.eyes === 'shine') { s += `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="4.8" fill="${K}"/><circle cx="${x - 1.2}" cy="${y - 1.8}" r="1.3" fill="#fff"/>`; }
    else { s += `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="3.6" fill="${K}"/>`; }
  });
  s += c.kind === 'chick'
    ? `<path d="M46 64 L54 64 L50 69Z" fill="#d98a3a"/>`
    : `<path d="M48 66.5 h4" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
  const acc: Record<string, string> = {
    crown: `<path d="M37 26 L39 13 L45 20 L50 10 L55 20 L61 13 L63 26Z" fill="#e7c46a" stroke="#8f6f22" stroke-width="1.6" stroke-linejoin="round"/>`,
    bow: `<path d="M58 30 L67 24 L67 36Z M58 30 L49 24 L49 36Z" fill="#b9504a" stroke="#7a2f2a" stroke-width="1.2" stroke-linejoin="round"/>`,
    moon: `<path d="M56 18 a9 9 0 1 0 8 13 a7 7 0 1 1 -8 -13z" fill="#efdfae" stroke="#a98d45" stroke-width="1.2"/>`,
    star: `<path d="M66 22 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill="#efdfae" stroke="#a98d45" stroke-width="1"/>`,
    leaf: `<path d="M50 22 q2 -10 12 -12 q-2 10 -12 12z" fill="#7f9b63" stroke="#4f6a3a" stroke-width="1.2"/>`,
    cherry: `<path d="M55 24 q4 -12 12 -14" stroke="#4f6a3a" stroke-width="1.6" fill="none"/><circle cx="55" cy="26" r="4.5" fill="#a83434"/>`
  };
  s += acc[c.accessory] ?? '';
  return s;
}

export function prizeSvg(id: string, form: PrizeForm, stroke: ArtStroke): string {
  const ch = charSvg(id, stroke);
  const c = CHARACTERS[id] ?? CHARACTERS['jin'];
  let s: string;
  switch (form) {
    case 'plush':
      s = `<ellipse cx="60" cy="110" rx="36" ry="6" fill="#0002"/><g transform="translate(8,8) scale(1.04)">${ch}</g>`; break;
    case 'figure':
    case 'deluxe': {
      const [a, b, e] = form === 'deluxe' ? ['#a8822e', '#f0d58f', '#8f6a1f'] : ['#c9c8c1', '#e2e1db', '#bdbcb5'];
      s = `<ellipse cx="60" cy="106" rx="36" ry="9" fill="${a}"/><ellipse cx="60" cy="102" rx="36" ry="9" fill="${b}" stroke="${e}" stroke-width="2"/><g transform="translate(14,6) scale(.92)">${ch}</g>`; break;
    }
    case 'stand':
      s = `<rect x="18" y="6" width="84" height="98" rx="16" fill="${c.body}" opacity=".22" stroke="#fff" stroke-width="3"/><rect x="24" y="12" width="12" height="40" rx="6" fill="#fff" opacity=".6"/><g transform="translate(16,12) scale(.88)">${ch}</g><rect x="28" y="104" width="64" height="10" rx="5" fill="#bdbcb5"/>`; break;
    case 'badge':
      s = `<circle cx="60" cy="60" r="52" fill="${c.shade}"/><circle cx="60" cy="60" r="46" fill="${c.body}" opacity=".35"/><circle cx="60" cy="60" r="46" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><g transform="translate(22,20) scale(.76)">${ch}</g><path d="M30 26 a42 42 0 0 1 30 -12" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>`; break;
    case 'sticker':
      s = `<g transform="rotate(-6 60 60)"><rect x="10" y="12" width="100" height="96" rx="30" fill="#fff" stroke="#dcdbd5" stroke-width="2"/><path d="M110 82 L84 108 L110 108Z" fill="#d3d2cc"/><g transform="translate(14,14) scale(.82)">${ch}</g></g>`; break;
    case 'pajama':
      s = `<ellipse cx="60" cy="108" rx="34" ry="8" fill="#c9c8c1"/><ellipse cx="60" cy="104" rx="34" ry="8" fill="#e2e1db" stroke="#bdbcb5" stroke-width="2"/><g transform="translate(14,12) scale(.9)">${ch}</g><path d="M34 34 Q46 0 94 12 Q80 18 86 30 Z" fill="#3e4a68" stroke="#1c2338" stroke-width="2" stroke-linejoin="round"/><path d="M50 30 L60 12 M66 30 L74 14" stroke="#fff" stroke-width="4" opacity=".8"/><rect x="31" y="27" width="58" height="10" rx="5" fill="#fff" stroke="#d0cfc9" stroke-width="1.5"/><circle cx="95" cy="13" r="7" fill="#fff" stroke="#d0cfc9" stroke-width="1.5"/><text x="98" y="48" font-size="13" font-weight="900" fill="#8d8d95" font-family="sans-serif">Zz</text>`; break;
    default:
      s = `<g transform="translate(10,10)">${ch}</g>`;
  }
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
