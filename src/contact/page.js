// Contact form → Web3Forms (https://web3forms.com): no server, no database; each message arrives by email.
// Without JS the form posts natively (Web3Forms shows its own confirmation). With JS: validation with
// messages under each field, fetch + JSON, accessible status, success panel. No key yet: the form says so
// and points to WhatsApp (the button in the same card).
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { fromParams, score, summary } from '../stories/quote.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
const T = UI.contact || {};
initNav({ labels: UI.a11y });
initTimecode();

const form = document.querySelector('[data-ct-form]');
const done = document.querySelector('[data-ct-done]');
const status = form?.querySelector('[data-ct-status]');
const submit = form?.querySelector('[data-ct-submit]');

const say = (text, error = false) => {
  status.textContent = text;
  status.classList.toggle('is-error', error);
};

function check(field) {
  const err = form.querySelector(`#${field.getAttribute('aria-describedby')?.split(' ').find(id => id.endsWith('-err'))}`);
  let ok = true;
  if (field.type === 'checkbox') ok = field.checked;
  else if (field.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim());
  else ok = field.value.trim().length > 1;
  field.setAttribute('aria-invalid', String(!ok));
  if (err) { err.textContent = ok ? '' : T[err.dataset.err] || ''; err.hidden = ok; }
  return ok;
}

// Coming from a MOVO Story (?story=01&duracion=60&estilo=…, the "Cotiza tu proyecto" of its quoter): the
// message starts with what the visitor chose (editable), and `story` travels in a hidden field so the
// email says where the lead came from.
function prefillFromStory() {
  const q = new URLSearchParams(location.search);
  const S = UI.story;
  const id = q.get('story');
  if (!id || !S || !form) return;
  const hidden = Object.assign(document.createElement('input'), { type: 'hidden', name: 'story', value: id.slice(0, 8) });
  form.append(hidden);
  const msg = form.querySelector('[name="message"]');
  if (!msg || msg.value.trim()) return;
  if (id === '01') {
    // the quoter's choices
    const s = fromParams(q);
    const level = S.quoter.levels[score(s).level - 1];
    msg.value = `${S.contactIntro}\n${summary(s, S.quoter)}\n${S.contactLevel}: ${level}\n\n`;
    return;
  }
  const title = UI.storyTitles?.[id];
  if (!title) return;
  let text = `${S.contact.from.replace('{title}', title)}\n`;
  // Story 03: the brand typed in the logo playground and the chosen personality
  const brand = (q.get('marca') || '').slice(0, 24);
  const personality = S.s03?.logo.options[q.get('personalidad')];
  if (id === '03' && (brand || personality)) {
    text += [brand && `${S.contact.brand}: ${brand}`, personality && `${S.contact.personality}: ${personality}`].filter(Boolean).join(' · ') + '\n';
  }
  msg.value = `${text}\n`;
}

if (form) {
  prefillFromStory();
  form.noValidate = true; // our messages instead of the browser's bubbles
  const required = [...form.querySelectorAll('[required]')];
  // a field with an error is re-checked while typing (not on blur: a message disappearing on blur would
  // move the submit button under the finger that is tapping it)
  required.forEach(f => f.addEventListener(f.type === 'checkbox' ? 'change' : 'input', () => f.getAttribute('aria-invalid') === 'true' && check(f)));
  const key = form.dataset.key;
  if (!key) say(T.inactive, true);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = required.filter(f => !check(f));
    if (bad.length) { bad[0].focus(); return; }
    if (!key) { say(T.inactive, true); return; }
    const data = Object.fromEntries(new FormData(form));
    data.needs = [...form.querySelectorAll('[name="needs"]:checked')].map(c => c.value).join(', ');
    if (data.botcheck) return; // a bot filled the trap
    delete data.botcheck;
    submit.disabled = true;
    say(T.sending);
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || res.status);
      form.reset();
      form.hidden = true;
      done.hidden = false;
      done.focus();
      say('');
    } catch {
      say(T.error, true);
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector('[data-ct-again]')?.addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    form.querySelector('input:not([type="hidden"])')?.focus();
  });
}
