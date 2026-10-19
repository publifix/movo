// The text of a story, from its Markdown (content/stories/<nn-slug>/story.<lang>.md: the approved copy is the
// source) to the HTML of the page. A small converter for what the stories use: front matter (ignored here),
// # H1 (the template has it), ## one act per heading (a <section> the timecode names: 01 Quieto…),
// ### headings, paragraphs, - and 1. lists, | tables |, **bold**, *italic*, [links](/path/) (root-relative
// paths become relative to the page), and directives on their own line:
//   ::scene <id>   a composition (scrubbed by the scroll)      ::quoter   Story 01's quoter
//   ::result       act 4: the result + CTA                      ::cta      the CTA button
// [PENDIENTE: …] notes are dropped from the page (and listed by the build).
import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function storyFile(root, story, lang) {
  return path.join(root, `${story.content}.${lang}.md`);
}

export function storyBody(file, { root, act, directive }) {
  const src = fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  const pending = [...src.matchAll(/\[PENDIENTE:[^\]]*\]/g)].map(m => m[0]);
  if (pending.length) console.warn(`[stories] ${path.basename(file)}: ${pending.length} [PENDIENTE] note(s) not shown on the page:\n  ${pending.join('\n  ')}`);
  const inline = s =>
    esc(s.replace(/\s*\[PENDIENTE:[^\]]*\]/g, ''))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => `<a href="${href.startsWith('/') ? root + href.slice(1) : href}">${text}</a>`);

  const out = [];
  let n = 0; // acts
  let open = false; // inside an act <section>
  let headed = true; // that act already has its <h2>
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('# ') || line.startsWith('>')) { i++; continue; }
    if (line.startsWith('::')) {
      const [name, arg] = line.slice(2).trim().split(/\s+/);
      // a scene before the first ## opens act 1 (the act starts with its scene, its <h2> follows)
      if (!open) { out.push(act(n++)); open = true; headed = false; }
      out.push(directive(name, arg));
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      if (!open || headed) {
        if (open) out.push('</section>');
        out.push(act(n++));
        open = true;
      }
      out.push(`<h2 id="${slug(title)}">${inline(title)}</h2>`);
      headed = true;
      i++;
      continue;
    }
    if (line.startsWith('### ')) { out.push(`<h3 id="${slug(line.slice(4))}">${inline(line.slice(4).trim())}</h3>`); i++; continue; }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const [head, , ...body] = rows;
      out.push(`<div class="sp-table"><table><thead><tr>${cells(head).map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body
        .map(r => `<tr>${cells(r).map((c, j) => (j ? `<td>${inline(c)}</td>` : `<th scope="row">${inline(c)}</th>`)).join('')}</tr>`)
        .join('')}</tbody></table></div>`);
      continue;
    }
    const list = /^(- |\d+\. )/.exec(line);
    if (list) {
      const ordered = list[1] !== '- ';
      const items = [];
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^(- |\d+\. )/.test(lines[i])) items.push(lines[i].replace(/^(- |\d+\. )/, ''));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const tagName = ordered ? 'ol' : 'ul';
      out.push(`<${tagName}>${items.map(it => `<li>${inline(it)}</li>`).join('')}</${tagName}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#|::|\||- |\d+\. |>)/.test(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  if (open) out.push('</section>');
  return out.join('\n');
}
