// A MOVO Story page (/stories/<slug>/). For now: navbar + timecode; the scenes of each act (scroll scrub,
// the interactive one) are added with the story itself (STORIES.md §6, after the text is approved).
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();
