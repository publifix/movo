// Story 01 quoter ("Arma tu video"): NO money (the site publishes no prices). Each choice adds points; the
// total gives an investment level (Esencial / Avanzado / Premium), its complexity and an approximate time.
// Points and cut-offs approved by Jerry (Oct 2026, storyboard of Story 01). Shared by the build (the result
// rendered for the default choices, so it reads right without JS) and the page (live), and by the contact
// page (?story=01&duracion=… prefills the message).
export const POINTS = {
  duracion: { 15: 1, 30: 2, 60: 3, 120: 4 },
  estilo: { tipografia: 1, ilustracion: 2, personajes: 4, '3d': 4 },
  guion: { cliente: 0, movo: 1 },
  urgencia: { normal: 0, urgente: 1 },
  extras: { cortes: 1, idioma: 1, voz: 0 },
  extraFormat: 0.5, // every format after the first
};
export const FORMATS = ['16x9', '9x16', '1x1'];
export const DEFAULTS = { duracion: '60', estilo: 'ilustracion', guion: 'movo', formatos: ['16x9', '9x16'], extras: ['voz'], urgencia: 'normal' };

export function score(s) {
  const p = (POINTS.duracion[s.duracion] ?? 0) + (POINTS.estilo[s.estilo] ?? 0) + (POINTS.guion[s.guion] ?? 0)
    + (POINTS.urgencia[s.urgencia] ?? 0) + Math.max(0, s.formatos.length - 1) * POINTS.extraFormat
    + s.extras.reduce((a, e) => a + (POINTS.extras[e] ?? 0), 0);
  return { points: p, level: p <= 4 ? 1 : p <= 7 ? 2 : 3 };
}

const one = (v, map, d) => (v != null && v in map ? String(v) : d);
const many = (v, allowed) => String(v || '').split(',').filter(x => allowed.includes(x));

export function fromParams(q) {
  const get = k => (q instanceof URLSearchParams ? q.get(k) : q[k]);
  return {
    duracion: one(get('duracion'), POINTS.duracion, DEFAULTS.duracion),
    estilo: one(get('estilo'), POINTS.estilo, DEFAULTS.estilo),
    guion: one(get('guion'), POINTS.guion, DEFAULTS.guion),
    formatos: get('formatos') == null ? DEFAULTS.formatos : many(get('formatos'), FORMATS),
    extras: get('extras') == null ? DEFAULTS.extras : many(get('extras'), Object.keys(POINTS.extras)),
    urgencia: one(get('urgencia'), POINTS.urgencia, DEFAULTS.urgencia),
  };
}

export const toParams = (s, story = '01') =>
  new URLSearchParams({ story, duracion: s.duracion, estilo: s.estilo, guion: s.guion, formatos: s.formatos.join(','), extras: s.extras.join(','), urgencia: s.urgencia }).toString();

// "60 s · Gráficos e ilustración · Guion de MOVO · 16:9, 9:16 · Voz en off" (labels: strings storyUi.quoter)
export function summary(s, Q) {
  const parts = [
    Q.duracion.options[s.duracion],
    Q.estilo.options[s.estilo],
    Q.guion.short[s.guion],
    s.formatos.map(f => Q.formatos.short[f]).join(', '),
    s.extras.map(e => Q.extras.short[e]).join(', '),
    s.urgencia === 'urgente' ? Q.urgencia.options.urgente : '',
  ];
  return parts.filter(Boolean).join(' · ');
}
