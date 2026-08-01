window.FinanceViews = window.FinanceViews || {};
FinanceViews.dashboard = async (app) => {
  const { api, ui, state, listen } = app,
    { esc, money } = ui,
    key = 'dashboard:' + state.month,
    d = await app.cached(key, () => api('/dashboard?month=' + state.month), 30000),
    s = d.summary,
    income = d.categories.filter((x) => x.type === 'income'),
    expense = d.categories.filter((x) => x.type === 'expense'),
    animate = state.dashboardSeen ? 0 : 280;
  content.innerHTML = `<div class="section-head"><div><h3>Tổng quan thu chi</h3><span class="muted">Theo dõi kết quả, không phải số dư ví thực tế</span></div><input type="month" id="monthPicker" class="form-control month-picker" value="${esc(state.month)}"></div><div class="grid summary-grid">${[
    ['Tổng thu', s.income, 'income', 'fa-arrow-trend-up'],
    ['Tổng chi', s.expense, 'expense', 'fa-arrow-trend-down'],
    ['Thu trừ chi', s.income - s.expense, 'net', 'fa-scale-balanced'],
    ['Đã trả nợ', s.paid, 'debt', 'fa-circle-check'],
  ]
    .map(
      (x) =>
        `<div class="cardx metric ${x[2]}"><small><i class="fa-solid ${x[3]} me-1"></i>${x[0]}</small><strong>${money(x[1])}</strong></div>`
    )
    .join(
      ''
    )}<button class="cardx metric debt-summary" id="openDebts" type="button"><small><i class="fa-solid fa-file-invoice-dollar me-1"></i>Tổng nợ còn lại</small><strong>${money(s.remaining)}</strong><span>Xem và quản lý nợ <i class="fa-solid fa-arrow-right"></i></span></button></div><div class="chart-grid section"><div class="cardx"><h5>Thu và chi theo ngày</h5><div class="chart"><canvas id="daily"></canvas></div></div><div class="cardx"><h5>Thu nhập theo nguồn</h5><div class="chart"><canvas id="incomeChart"></canvas></div></div><div class="cardx"><h5>Chi tiêu theo danh mục</h5><div class="chart"><canvas id="expenseChart"></canvas></div></div><div class="cardx"><h5>Chi theo phương thức</h5><div class="chart"><canvas id="methodChart"></canvas></div></div></div><div class="cardx section"><h5>Giao dịch gần đây</h5>${app.txTable(d.recent)}</div>`;
  listen(monthPicker, 'change', () => {
    state.month = monthPicker.value;
    app.load('dashboard');
  });
  listen(openDebts, 'click', () => app.load('debts'));
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: animate },
  };
  app.charts.push(
    new Chart(daily, {
      type: 'line',
      data: {
        labels: d.daily.map((x) => x.day.slice(8)),
        datasets: [
          {
            label: 'Thu',
            data: d.daily.map((x) => x.income),
            borderColor: '#16a673',
            tension: 0.35,
          },
          {
            label: 'Chi',
            data: d.daily.map((x) => x.expense),
            borderColor: '#ed5b68',
            tension: 0.35,
          },
        ],
      },
      options,
    }),
    new Chart(incomeChart, {
      type: 'doughnut',
      data: {
        labels: income.map((x) => x.label),
        datasets: [{ data: income.map((x) => x.value) }],
      },
      options,
    }),
    new Chart(expenseChart, {
      type: 'doughnut',
      data: {
        labels: expense.map((x) => x.label),
        datasets: [{ data: expense.map((x) => x.value) }],
      },
      options,
    }),
    new Chart(methodChart, {
      type: 'bar',
      data: {
        labels: d.payment_methods.map((x) => x.label),
        datasets: [
          { label: 'Chi', data: d.payment_methods.map((x) => x.value), backgroundColor: '#6259e8' },
        ],
      },
      options,
    })
  );
  state.dashboardSeen = true;
  app.bindTx(d.recent);
};
