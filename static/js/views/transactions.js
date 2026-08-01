window.FinanceViews = window.FinanceViews || {};
FinanceViews.transactions = async (app) => {
  const { api, ui, state, listen } = app,
    { esc, select } = ui;
  await app.base();
  const params = new URLSearchParams({ page: state.txPage, per_page: 25 }),
    f = state.filters;
  Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
  const result = await api('/transactions?' + params),
    items = result.items;
  content.innerHTML = `<div class="section-head"><div><h3>Sổ thu chi</h3><span class="muted">Ghi nhanh thu nhập và chi tiêu thực tế</span></div><button class="btn btn-primary" id="addTx">＋ Ghi giao dịch</button></div><div class="cardx filter-grid"><input class="form-control" id="fQ" placeholder="Tìm nội dung" value="${esc(f.q)}"><input class="form-control" id="fMonth" type="month" value="${esc(f.month)}">${select(
    'fType',
    'Loại',
    [
      { id: '', name: 'Tất cả' },
      { id: 'income', name: 'Thu nhập' },
      { id: 'expense', name: 'Chi tiêu' },
    ],
    f.type
  )}${select('fCategory', 'Danh mục', [{ id: '', name: 'Tất cả danh mục' }, ...state.categories], f.category_id)}${select('fAccount', 'Phương thức', [{ id: '', name: 'Tất cả phương thức' }, ...state.methods], f.account_id)}<button class="btn btn-outline-primary" id="applyFilter">Lọc</button></div><div class="cardx section">${app.txTable(items)}<div class="d-flex justify-content-between"><small class="muted">${result.pagination.total} giao dịch</small><div><button id="prev" class="btn btn-sm btn-light" ${state.txPage <= 1 ? 'disabled' : ''}>Trước</button> <button id="next" class="btn btn-sm btn-light" ${state.txPage >= result.pagination.pages ? 'disabled' : ''}>Sau</button></div></div></div>`;
  listen(addTx, 'click', () => app.txForm());
  listen(applyFilter, 'click', () => {
    state.filters = {
      q: fQ.value,
      month: fMonth.value,
      type: document.querySelector('[name=fType]').value,
      category_id: document.querySelector('[name=fCategory]').value,
      account_id: document.querySelector('[name=fAccount]').value,
    };
    state.txPage = 1;
    app.load('transactions');
  });
  listen(prev, 'click', () => {
    state.txPage--;
    app.load('transactions');
  });
  listen(next, 'click', () => {
    state.txPage++;
    app.load('transactions');
  });
  app.bindTx(items);
};
