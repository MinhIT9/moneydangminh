'use client';

export default function PrivateError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="error-card" role="alert">
      <span className="badge danger">Có lỗi tạm thời</span>
      <h1>Chưa tải được dữ liệu của bạn</h1>
      <p>
        Hãy thử lại. Nếu lỗi vẫn tiếp diễn, kiểm tra kết nối mạng hoặc cấu hình máy chủ rồi liên hệ
        hỗ trợ.
      </p>
      <button className="button" type="button" onClick={reset}>
        Thử lại
      </button>
    </section>
  );
}
