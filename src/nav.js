// Navbar: background once the page scrolls, accessible mobile menu.
export function initNav() {
  const header = document.querySelector('[data-site-header]');
  const nav = header?.querySelector('.nav');
  const toggle = header?.querySelector('[data-nav-toggle]');
  const menu = header?.querySelector('[data-nav-menu]');
  if (!header || !nav || !toggle || !menu) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const mobile = matchMedia('(max-width: 767px)');
  const links = [...menu.querySelectorAll('a')];

  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) links[0]?.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach(a => a.addEventListener('click', () => mobile.matches && setOpen(false)));

  document.addEventListener('keydown', e => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
    // Keep focus inside the open menu (toggle + links)
    if (e.key === 'Tab') {
      const items = [toggle, ...links];
      const i = items.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
      e.preventDefault();
      items[next].focus();
    }
  });

  mobile.addEventListener('change', e => !e.matches && setOpen(false));
}
