(() => {
  const root = document.documentElement,
    themeButton = document.querySelector('#theme'),
    animatedViews = new Set();
  if (localStorage.getItem('finance-theme') === 'dark') root.classList.add('dark');
  const setIcon = () => {
    const icon = themeButton?.querySelector('i');
    if (icon)
      icon.className = root.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  };
  setIcon();
  themeButton?.addEventListener('click', () => {
    localStorage.setItem('finance-theme', root.classList.contains('dark') ? 'dark' : 'light');
    setIcon();
  });
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.color = getComputedStyle(root).getPropertyValue('--muted').trim();
  Chart.defaults.borderColor = 'rgba(120,130,160,.12)';
  const content = document.querySelector('#content');
  function reveal() {
    const view = content?.dataset.view,
      cards = content?.querySelectorAll('.cardx');
    if (!view || !cards?.length || animatedViews.has(view)) return;
    animatedViews.add(view);
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => {
        card.style.transitionDelay = `${Math.min(index, 4) * 20}ms`;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 10);
    });
  }
  if (content) new MutationObserver(reveal).observe(content, { childList: true });
  document.addEventListener(
    'pointerdown',
    (event) => {
      const button = event.target.closest('.btn,.icon-btn,.fab,nav button');
      if (!button) return;
      button.style.transform = 'scale(.97)';
      setTimeout(() => (button.style.transform = ''), 100);
    },
    { passive: true }
  );
})();
