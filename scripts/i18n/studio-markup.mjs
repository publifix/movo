// Studio markup (home teaser band + Studio page + site footer), rendered into the static HTML of every
// language. Data: src/data/clients.json (marquee names) · src/data/network.json (Publifix Network).
// Copy: src/i18n/<lang>.json → studio / studioUi / footer. No images: names are type, the network is SVG.

import fs from 'node:fs';

const CLIENTS = new URL('../../src/data/clients.json', import.meta.url);
const NETWORK = new URL('../../src/data/network.json', import.meta.url);
export const STUDIO_DATA = [CLIENTS, NETWORK].map(u => u.pathname);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// One band of the marquee: the list is in the HTML once; src/studio/marquee.js clones it (aria-hidden)
// for the seamless loop. Without JS / with reduced motion it is a static, wrapped list.
// Each name takes one of four type styles (weight × width of the variable font), in a fixed rhythm.
const band = (names, dir, offset = 0) => `<div class="mq" data-mq data-dir="${dir}">
          <div class="mq__track" data-mq-track>
            <ul class="mq__list" role="list">${names
              .map((n, i) => `<li class="mq__item mq__item--${(i + offset) % 4}">${esc(n)}<span class="mq__kf" aria-hidden="true"></span></li>`)
              .join('')}</ul>
          </div>
        </div>`;

// Diagram geometry (SVG viewBox units). MOVO in the center, five nodes around it; each connection is a
// gentle curve. The HTML nodes are placed at the same points (percentages), so lines and links match.
const VB = { w: 1200, h: 680 };
const CENTER = { x: 600, y: 330 };
const POINTS = [
  { x: 210, y: 120 },
  { x: 990, y: 120 },
  { x: 150, y: 455 },
  { x: 1050, y: 455 },
  { x: 600, y: 590 },
];
const curve = (a, b, bend) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
  return `M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
};

export function studioMarkup({ t, lang }) {
  const { clients } = JSON.parse(fs.readFileSync(CLIENTS, 'utf8'));
  const { companies } = JSON.parse(fs.readFileSync(NETWORK, 'utf8'));
  const newTab = `<span class="sr-only"> ${esc(t.studioUi.newTab)}</span>`;
  const half = Math.ceil(clients.length / 2);

  const link = (c, cls) =>
    `<a class="${cls}" href="${esc(c.url)}" target="_blank" rel="noopener">` +
    `<span class="${cls}-name">${esc(c.name)}</span>` +
    `<span class="${cls}-desc">${esc(c.description[lang] ?? c.description.es)}</span>${newTab}</a>`;

  const paths = companies.map((c, i) => curve(CENTER, POINTS[i % POINTS.length], i % 2 ? -60 : 60));
  const svg = `<svg class="net__svg" viewBox="0 0 ${VB.w} ${VB.h}" aria-hidden="true" focusable="false">
            <g class="net__lines">${paths.map((d, i) => `<path class="net__line" d="${d}" pathLength="100" data-net-line="${i}" />`).join('')}</g>
            <g class="net__pulses">${paths.map((d, i) => `<path class="net__pulse" d="${d}" pathLength="100" style="--i: ${i}" />`).join('')}</g>
          </svg>`;
  const nodes = companies
    .map((c, i) => {
      const p = POINTS[i % POINTS.length];
      const pos = `--x: ${((p.x / VB.w) * 100).toFixed(2)}%; --y: ${((p.y / VB.h) * 100).toFixed(2)}%`;
      return `<li class="net__node" style="${pos}" data-net-node="${i}">${link(c, 'net__link')}</li>`;
    })
    .join('\n            ');
  const center = `--x: ${((CENTER.x / VB.w) * 100).toFixed(2)}%; --y: ${((CENTER.y / VB.h) * 100).toFixed(2)}%`;

  return {
    studioTeaserBand: band(clients, -1),
    studioBandA: band(clients.slice(0, half), -1),
    studioBandB: band(clients.slice(half), 1, 2),
    studioNetwork: `<div class="net__map" data-net style="--ar: ${VB.w} / ${VB.h}">
          ${svg}
          <p class="net__center" style="${center}" aria-hidden="true"><svg class="net__logo" viewBox="3 3 1975 443" width="1975" height="443" aria-hidden="true" focusable="false"><use href="#movo-wordmark" /></svg></p>
          <ul class="net__list" role="list">
            ${nodes}
          </ul>
        </div>`,
    // footer: names only, discreet (the descriptions live on the Studio page)
    footerNetwork: companies
      .map(c => `<li><a class="site-footer__link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}${newTab}</a></li>`)
      .join(''),
  };
}
