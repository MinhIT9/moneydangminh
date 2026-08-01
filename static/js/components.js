window.FinanceComponents = (() => {
  const empty = (message, icon = 'fa-box-open') => `
    <div class="empty-compact" role="status">
      <i class="fa-solid ${icon}" aria-hidden="true"></i>
      <span>${message}</span>
    </div>`;

  const loading = () => '<div class="skeleton" aria-label="Đang tải nội dung"></div>';

  const pagination = ({ page, pages, total }) => `
    <div class="d-flex justify-content-between align-items-center">
      <small class="muted">${total} giao dịch</small>
      <div>
        <button id="prev" class="btn btn-sm btn-light" ${page <= 1 ? 'disabled' : ''}>Trước</button>
        <button id="next" class="btn btn-sm btn-light" ${page >= pages ? 'disabled' : ''}>Sau</button>
      </div>
    </div>`;

  return { empty, loading, pagination };
})();
