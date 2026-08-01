import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chính sách riêng tư | Minh Finance',
  description:
    'Tìm hiểu cách Minh Finance thu thập, sử dụng và bảo vệ dữ liệu tài chính cá nhân của bạn.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Chính sách riêng tư | Minh Finance',
    description: 'Thông tin về việc thu thập, sử dụng và bảo vệ dữ liệu cá nhân tại Minh Finance.',
    url: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <style>{legalStyles}</style>
      <header className="legal-page__header">
        <Link className="legal-page__brand" href="/">
          <span aria-hidden="true">M</span>
          Minh Finance
        </Link>
        <Link className="legal-page__back" href="/">
          ← Về trang chủ
        </Link>
      </header>

      <article className="legal-page__content">
        <p className="legal-page__eyebrow">Minh Finance</p>
        <h1>Chính sách riêng tư</h1>
        <p className="legal-page__updated">Cập nhật lần cuối: 02/08/2026</p>
        <p className="legal-page__intro">
          Minh Finance tôn trọng quyền riêng tư của bạn. Chính sách này giải thích những dữ liệu cần
          thiết để vận hành ứng dụng ghi thu chi và cách chúng được sử dụng.
        </p>

        <section>
          <h2>1. Dữ liệu chúng tôi thu thập</h2>
          <p>Khi bạn tạo và sử dụng tài khoản, Minh Finance có thể lưu:</p>
          <ul>
            <li>Thông tin tài khoản như email, số điện thoại và mật khẩu đã được mã hóa.</li>
            <li>
              Dữ liệu bạn chủ động nhập: giao dịch thu chi, danh mục, phương thức thanh toán, ghi
              chú và khoản nợ.
            </li>
            <li>
              Dữ liệu kỹ thuật tối thiểu cần để bảo mật và vận hành dịch vụ, như thời điểm đăng nhập
              hoặc thông tin phiên làm việc.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. Chúng tôi dùng dữ liệu để làm gì?</h2>
          <p>Dữ liệu của bạn chỉ được dùng để:</p>
          <ul>
            <li>Hiển thị sổ thu chi, báo cáo và các tổng hợp tài chính theo yêu cầu của bạn.</li>
            <li>Xác thực tài khoản, bảo vệ phiên đăng nhập và hỗ trợ khi có yêu cầu.</li>
            <li>Cải thiện độ ổn định, an toàn và trải nghiệm sử dụng của Minh Finance.</li>
          </ul>
          <p>
            Minh Finance không bán hoặc cho thuê dữ liệu tài chính cá nhân của bạn cho bên thứ ba
            nhằm mục đích quảng cáo.
          </p>
        </section>

        <section>
          <h2>3. Ai có thể xem dữ liệu?</h2>
          <p>
            Dữ liệu thu chi được gắn với tài khoản của bạn. Người dùng khác không thể xem dữ liệu
            này chỉ bằng cách thay đổi đường dẫn hay thông tin trên trình duyệt. Nhân sự hỗ trợ chỉ
            tiếp cận thông tin cần thiết khi bạn yêu cầu hỗ trợ và trong phạm vi cần thiết để xử lý
            yêu cầu đó.
          </p>
        </section>

        <section>
          <h2>4. Bảo mật dữ liệu</h2>
          <p>
            Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép, bao gồm
            xác thực tài khoản, phân quyền dữ liệu và bảo vệ mật khẩu. Tuy nhiên, không có phương
            thức truyền tải hoặc lưu trữ điện tử nào an toàn tuyệt đối; bạn cũng nên dùng mật khẩu
            riêng, mạnh và không chia sẻ với người khác.
          </p>
        </section>

        <section>
          <h2>5. Lưu giữ và xóa dữ liệu</h2>
          <p>
            Chúng tôi lưu dữ liệu trong thời gian tài khoản của bạn còn hoạt động hoặc khi cần thiết
            để cung cấp dịch vụ. Bạn có thể liên hệ bộ phận hỗ trợ nếu muốn yêu cầu xóa tài khoản
            hoặc hỏi về dữ liệu cá nhân của mình.
          </p>
        </section>

        <section>
          <h2>6. Thay đổi chính sách</h2>
          <p>
            Khi có thay đổi quan trọng, chúng tôi sẽ cập nhật ngày ở đầu trang này. Việc tiếp tục sử
            dụng Minh Finance sau khi chính sách mới được công bố được hiểu là bạn đã xem và chấp
            nhận nội dung cập nhật.
          </p>
        </section>

        <section>
          <h2>7. Liên hệ</h2>
          <p>
            Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu của bạn, hãy xem trang{' '}
            <Link href="/support">Hỗ trợ</Link> để gửi yêu cầu.
          </p>
        </section>
      </article>
    </main>
  );
}

const legalStyles = `
  .legal-page { min-height: 100vh; color: #1b2333; background: #fcfcff; font-family: Arial, Helvetica, sans-serif; line-height: 1.65; }
  .legal-page *, .legal-page *::before, .legal-page *::after { box-sizing: border-box; }
  .legal-page a { color: #5a3be0; text-decoration: none; font-weight: 750; }
  .legal-page a:hover { text-decoration: underline; }
  .legal-page__header { width: min(900px, calc(100% - 40px)); min-height: 76px; margin: auto; display: flex; align-items: center; justify-content: space-between; }
  .legal-page__brand { display: inline-flex; align-items: center; gap: 9px; color: #1b2333 !important; font-size: 17px; font-weight: 850 !important; letter-spacing: -.03em; }
  .legal-page__brand span { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, #876eff, #5836df); }
  .legal-page__back { color: #667085 !important; font-size: 14px; }
  .legal-page__content { width: min(760px, calc(100% - 40px)); margin: 36px auto 80px; padding: clamp(28px, 6vw, 58px); border: 1px solid #e8e9ef; border-radius: 24px; background: #fff; box-shadow: 0 18px 50px rgba(39, 31, 75, .06); }
  .legal-page__eyebrow { margin: 0 0 10px; color: #6545ee; font-size: 12px; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
  .legal-page h1 { margin: 0; font-size: clamp(34px, 6vw, 50px); line-height: 1.12; letter-spacing: -.05em; }
  .legal-page__updated { margin: 11px 0 27px; color: #7b8496; font-size: 13px; }
  .legal-page__intro { margin-bottom: 36px; color: #4f596b; font-size: 17px; }
  .legal-page section { margin-top: 31px; }
  .legal-page h2 { margin: 0 0 10px; font-size: 19px; letter-spacing: -.02em; }
  .legal-page p { margin: 0 0 12px; color: #4f596b; font-size: 15px; }
  .legal-page ul { margin: 0; padding-left: 22px; color: #4f596b; }
  .legal-page li { margin: 7px 0; font-size: 15px; }
  @media (max-width: 500px) { .legal-page__header, .legal-page__content { width: calc(100% - 28px); } .legal-page__content { margin-top: 20px; padding: 26px 21px; border-radius: 18px; } }
`;
