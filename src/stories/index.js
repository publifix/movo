// MOVO Stories index (/stories/): text and the featured cover (its scene's final frame, static) are in the
// HTML; this only wires the shared navbar and timecode. Nothing animates on this page.
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();
