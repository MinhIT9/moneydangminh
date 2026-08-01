export default function PrivateLoading() {
  return (
    <div className="loading-page" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="loading-page__heading skeleton" />
      <div className="loading-page__subheading skeleton" />
      <div className="loading-page__cards">
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
      </div>
      <div className="loading-page__content skeleton" />
    </div>
  );
}
