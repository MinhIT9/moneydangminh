(() => {
  const content = document.querySelector('#content'),
    formatText = (node) => {
      if (node.nodeType === Node.TEXT_NODE && /\d{4}-\d{2}-\d{2}/.test(node.nodeValue))
        node.nodeValue = node.nodeValue.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3/$2/$1');
    },
    localizeMonthInput = (input) => {
      if (input.dataset.vnLocalized) return;
      const match = (input.value || ui.currentMonth()).match(/^(\d{4})-(\d{2})$/);
      if (!match) return;
      const selectedYear = Number(match[1]),
        selectedMonth = Number(match[2]),
        select = document.createElement('select');
      select.className = `${input.className} vn-month-select`;
      select.setAttribute('aria-label', 'Chọn tháng');
      for (let year = selectedYear - 3; year <= selectedYear + 3; year++)
        for (let month = 1; month <= 12; month++) {
          const option = document.createElement('option'),
            value = `${year}-${String(month).padStart(2, '0')}`;
          option.value = value;
          option.textContent = `Tháng ${month} năm ${year}`;
          option.selected = year === selectedYear && month === selectedMonth;
          select.append(option);
        }
      input.dataset.vnLocalized = 'true';
      input.style.display = 'none';
      input.insertAdjacentElement('afterend', select);
      select.addEventListener('change', () => {
        input.value = select.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },
    formatContent = () => {
      if (!content) return;
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) formatText(walker.currentNode);
      content.querySelectorAll('input[type="month"]').forEach(localizeMonthInput);
    };
  if (content)
    new MutationObserver(formatContent).observe(content, { childList: true, subtree: true });
  formatContent();
  setTimeout(() => {
    if (!window.financeApp) return;
    const month = ui.currentMonth();
    if (financeApp.state.month !== month) {
      financeApp.state.month = month;
      financeApp.state.filters.month = month;
      financeApp.invalidate();
      financeApp.load('dashboard');
    }
  }, 0);
})();
