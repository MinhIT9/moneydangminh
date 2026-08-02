import type { Locale } from '@/i18n/config';

type SupportCopy = {
  home: string;
  eyebrow: string;
  title: string;
  description: string;
  contentLabel: string;
  guides: Array<{ title: string; description: string }>;
  contactEyebrow: string;
  contactTitle: string;
  contactDescription: string;
  contactAction: string;
  contactSubject: string;
  emailUnavailable: string;
  securityTitle: string;
  securityDescription: string;
  privacyAction: string;
};

type PrivacyCopy = {
  home: string;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
    items?: string[];
  }>;
  supportLink: string;
  supportSuffix: string;
};

export const supportCopy: Record<Locale, SupportCopy> = {
  vi: {
    home: '← Về trang chủ',
    eyebrow: 'TRUNG TÂM HỖ TRỢ',
    title: 'Bạn cần giúp ở chỗ nào?',
    description:
      'Dù là khoản ghi chép đầu tiên hay một câu hỏi về tài khoản, chúng tôi luôn muốn việc quản lý tiền của bạn nhẹ nhàng hơn.',
    contentLabel: 'Các cách nhận hỗ trợ',
    guides: [
      {
        title: 'Bắt đầu ghi thu chi',
        description:
          'Chọn nút Ghi thu chi, chọn Thu nhập hoặc Chi tiêu, rồi nhập số tiền và ngày phát sinh. Danh mục và phương thức thanh toán là tùy chọn linh hoạt.',
      },
      {
        title: 'Xem lại tháng của bạn',
        description:
          'Trên Tổng quan, chọn tháng muốn xem để biết tổng thu, tổng chi và các khoản gần đây. Bạn có thể dùng bộ lọc ở Sổ thu chi để tìm nhanh hơn.',
      },
      {
        title: 'Quản lý danh mục và nợ',
        description:
          'Tạo danh mục theo thói quen của bạn như Tiền chợ, Học phí hay Lái hộ. Mục Khoản nợ giúp bạn theo dõi số tiền còn lại cần trả hoặc cần thu.',
      },
    ],
    contactEyebrow: 'VẪN CẦN HỖ TRỢ?',
    contactTitle: 'Gửi câu hỏi cho Heo Xinh',
    contactDescription:
      'Hãy mô tả ngắn tình huống bạn gặp phải, kèm ảnh màn hình nếu có. Chúng tôi sẽ phản hồi qua email sớm nhất có thể.',
    contactAction: 'Gửi email hỗ trợ',
    contactSubject: 'Hỗ trợ Heo Xinh',
    emailUnavailable:
      'Kênh email hỗ trợ đang được cập nhật. Người vận hành cần cấu hình SUPPORT_EMAIL trước khi public.',
    securityTitle: 'Lưu ý bảo mật',
    securityDescription:
      'Đừng gửi mật khẩu hoặc mã xác thực qua email. Chúng tôi sẽ không bao giờ yêu cầu bạn cung cấp mật khẩu để hỗ trợ.',
    privacyAction: 'Xem Chính sách riêng tư',
  },
  en: {
    home: '← Back to home',
    eyebrow: 'HELP CENTRE',
    title: 'How can we help?',
    description:
      'Whether it is your first record or a question about your account, we want managing your money to feel lighter.',
    contentLabel: 'Ways to get help',
    guides: [
      {
        title: 'Start tracking money',
        description:
          'Choose Save transaction, choose Income or Expense, then enter the amount and date. Categories and payment methods are flexible options.',
      },
      {
        title: 'Review your month',
        description:
          'On Overview, choose a month to see total income, total expenses, and recent records. Use the Money journal filters to find items faster.',
      },
      {
        title: 'Manage categories and debts',
        description:
          'Create categories around your habits, such as Groceries, Tuition, or Driving. Debts helps you track the amount still to pay or collect.',
      },
    ],
    contactEyebrow: 'STILL NEED HELP?',
    contactTitle: 'Send Heo Xinh a question',
    contactDescription:
      'Briefly describe the situation you are facing and attach a screenshot if available. We will reply by email as soon as possible.',
    contactAction: 'Email support',
    contactSubject: 'Heo Xinh support',
    emailUnavailable:
      'The support email channel is being set up. The operator needs to configure SUPPORT_EMAIL before publishing.',
    securityTitle: 'Security reminder',
    securityDescription:
      'Do not send your password or verification codes by email. We will never ask for your password to provide support.',
    privacyAction: 'View the Privacy policy',
  },
};

export const privacyCopy: Record<Locale, PrivacyCopy> = {
  vi: {
    home: '← Về trang chủ',
    eyebrow: 'Heo Xinh',
    title: 'Chính sách riêng tư',
    updated: 'Cập nhật lần cuối: 02/08/2026',
    intro:
      'Heo Xinh tôn trọng quyền riêng tư của bạn. Chính sách này giải thích dữ liệu cần thiết để vận hành tính năng tài chính, giải trí và cách chúng được sử dụng.',
    sections: [
      {
        title: '1. Dữ liệu chúng tôi thu thập',
        paragraphs: ['Khi bạn tạo và sử dụng tài khoản, Heo Xinh có thể lưu:'],
        items: [
          'Thông tin tài khoản như email, số điện thoại và mật khẩu đã được mã hóa.',
          'Dữ liệu bạn chủ động nhập: giao dịch thu chi, danh mục, phương thức thanh toán, ghi chú và khoản nợ.',
          'Dữ liệu kỹ thuật tối thiểu cần để bảo mật và vận hành dịch vụ, như thời điểm đăng nhập hoặc thông tin phiên làm việc.',
        ],
      },
      {
        title: '2. Chúng tôi dùng dữ liệu để làm gì?',
        paragraphs: ['Dữ liệu của bạn chỉ được dùng để:'],
        items: [
          'Hiển thị sổ thu chi, báo cáo và các tổng hợp tài chính theo yêu cầu của bạn.',
          'Xác thực tài khoản, bảo vệ phiên đăng nhập và hỗ trợ khi có yêu cầu.',
          'Cải thiện độ ổn định, an toàn và trải nghiệm sử dụng của Heo Xinh.',
          'Heo Xinh không bán hoặc cho thuê dữ liệu tài chính cá nhân của bạn cho bên thứ ba nhằm mục đích quảng cáo.',
        ],
      },
      {
        title: '3. Ai có thể xem dữ liệu?',
        paragraphs: [
          'Dữ liệu thu chi được gắn với tài khoản của bạn. Người dùng khác không thể xem dữ liệu này chỉ bằng cách thay đổi đường dẫn hay thông tin trên trình duyệt. Nhân sự hỗ trợ chỉ tiếp cận thông tin cần thiết khi bạn yêu cầu hỗ trợ và trong phạm vi cần thiết để xử lý yêu cầu đó.',
        ],
      },
      {
        title: '4. Bảo mật dữ liệu',
        paragraphs: [
          'Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép, bao gồm xác thực tài khoản, phân quyền dữ liệu và bảo vệ mật khẩu. Tuy nhiên, không có phương thức truyền tải hoặc lưu trữ điện tử nào an toàn tuyệt đối; bạn cũng nên dùng mật khẩu riêng, mạnh và không chia sẻ với người khác.',
        ],
      },
      {
        title: '5. Lưu giữ và xóa dữ liệu',
        paragraphs: [
          'Chúng tôi lưu dữ liệu trong thời gian tài khoản của bạn còn hoạt động hoặc khi cần thiết để cung cấp dịch vụ. Bạn có thể liên hệ bộ phận hỗ trợ nếu muốn yêu cầu xóa tài khoản hoặc hỏi về dữ liệu cá nhân của mình.',
        ],
      },
      {
        title: '6. Thay đổi chính sách',
        paragraphs: [
          'Khi có thay đổi quan trọng, chúng tôi sẽ cập nhật ngày ở đầu trang này. Việc tiếp tục sử dụng Heo Xinh sau khi chính sách mới được công bố được hiểu là bạn đã xem và chấp nhận nội dung cập nhật.',
        ],
      },
      {
        title: '7. Liên hệ',
        paragraphs: ['Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu của bạn, hãy xem trang'],
      },
    ],
    supportLink: 'Hỗ trợ',
    supportSuffix: 'để gửi yêu cầu.',
  },
  en: {
    home: '← Back to home',
    eyebrow: 'Heo Xinh',
    title: 'Privacy policy',
    updated: 'Last updated: 2 August 2026',
    intro:
      'Heo Xinh respects your privacy. This policy explains the information needed to operate its finance and entertainment features and how it is used.',
    sections: [
      {
        title: '1. Information we collect',
        paragraphs: ['When you create and use an account, Heo Xinh may store:'],
        items: [
          'Account details such as your email address, phone number, and encrypted password.',
          'Information you choose to enter: income and expense transactions, categories, payment methods, notes, and debts.',
          'The minimum technical information needed to secure and operate the service, such as sign-in timestamps and session information.',
        ],
      },
      {
        title: '2. How we use your information',
        paragraphs: ['Your information is only used to:'],
        items: [
          'Show your money journal, reports, and financial summaries when you request them.',
          'Authenticate your account, protect your sign-in session, and help when you request support.',
          'Improve the reliability, safety, and user experience of Heo Xinh.',
          'Heo Xinh does not sell or rent your personal financial information to third parties for advertising.',
        ],
      },
      {
        title: '3. Who can view your information?',
        paragraphs: [
          'Your financial information is linked to your account. Other users cannot access it simply by changing a URL or browser data. Support staff access only the information necessary when you request help, and only to the extent needed to handle that request.',
        ],
      },
      {
        title: '4. Information security',
        paragraphs: [
          'We apply appropriate technical measures to limit unauthorised access, including account authentication, data access controls, and password protection. However, no electronic transmission or storage method is completely secure; you should also use a strong, unique password and never share it with others.',
        ],
      },
      {
        title: '5. Retention and deletion',
        paragraphs: [
          'We retain information while your account remains active or as needed to provide the service. You can contact support to request account deletion or ask about your personal information.',
        ],
      },
      {
        title: '6. Policy changes',
        paragraphs: [
          'When important changes are made, we will update the date at the top of this page. Continuing to use Heo Xinh after a new policy is published means you have reviewed and accepted the updated content.',
        ],
      },
      {
        title: '7. Contact',
        paragraphs: ['If you have a question about privacy or your information, visit the'],
      },
    ],
    supportLink: 'Support page',
    supportSuffix: 'to send a request.',
  },
};
