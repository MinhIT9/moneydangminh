import type { Locale } from '@/i18n/config';

type LandingCopy = {
  homeLabel: string;
  navigationLabel: string;
  navigation: {
    features: string;
    audience: string;
    questions: string;
  };
  login: string;
  startFree: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    note: string;
    previewLabel: string;
  };
  preview: {
    currentMonth: string;
    currentMonthValue: string;
    balance: string;
    balanceChange: string;
    income: string;
    expense: string;
    recent: string;
    incomeItem: string;
    expenseItem: string;
  };
  features: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  audience: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  visuals: {
    eyebrow: string;
    title: string;
    description: string;
    heroAlt: string;
    studentAlt: string;
    familyAlt: string;
  };
  steps: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
  };
  footer: {
    description: string;
    privacy: string;
    support: string;
  };
};

export const landingCopy: Record<Locale, LandingCopy> = {
  vi: {
    homeLabel: 'Trang chủ Heo Xinh',
    navigationLabel: 'Điều hướng chính',
    navigation: {
      features: 'Tính năng',
      audience: 'Dành cho bạn',
      questions: 'Câu hỏi',
    },
    login: 'Đăng nhập',
    startFree: 'Bắt đầu miễn phí',
    hero: {
      eyebrow: 'Sổ thu chi nhẹ nhàng cho mỗi ngày',
      title: 'Thu chi rõ ràng, sống nhẹ nhàng.',
      description:
        'Ghi một khoản thu hoặc chi trong vài giây. Heo Xinh giúp bạn nhìn lại tháng của mình rõ ràng hơn, rồi thư giãn với trò chơi trí tuệ nhẹ nhàng.',
      primaryAction: 'Tạo sổ thu chi của tôi',
      secondaryAction: 'Xem cách hoạt động',
      note: 'Dễ dùng trên điện thoại, máy tính bảng và máy tính.',
      previewLabel: 'Minh họa màn hình tổng quan thu chi',
    },
    preview: {
      currentMonth: 'Tháng này',
      currentMonthValue: 'Tháng 8 năm 2026',
      balance: 'Số tiền còn lại',
      balanceChange: '+ 320.000 đ so với tuần trước',
      income: 'Đã thu',
      expense: 'Đã chi',
      recent: 'Ghi chép gần đây',
      incomeItem: 'Chạy Bee',
      expenseItem: 'Tiền chợ',
    },
    features: {
      eyebrow: 'Đủ đơn giản để dùng mỗi ngày',
      title: 'Không cần giỏi tài chính mới quản lý được tiền.',
      description:
        'Bắt đầu từ những điều gần gũi nhất: một cuốc xe, ly nước, tiền chợ hay khoản lương vừa nhận.',
      items: [
        {
          title: 'Ghi nhanh, không rườm rà',
          description: 'Chọn Thu hoặc Chi, nhập số tiền và danh mục. Vậy là xong một lần ghi chép.',
        },
        {
          title: 'Nhìn tổng quan theo tháng',
          description:
            'Biết tiền đã vào bao nhiêu, đã chi cho việc gì và tháng này còn dư bao nhiêu.',
        },
        {
          title: 'Linh hoạt theo cách bạn sống',
          description:
            'Ghi kèm tiền mặt, MoMo hay ngân hàng nếu cần đối chiếu; không bắt buộc phải quản lý tài khoản phức tạp.',
        },
      ],
    },
    audience: {
      eyebrow: 'Một công cụ nhỏ, nhiều hoàn cảnh sống',
      title: 'Heo Xinh đồng hành cùng bạn theo cách riêng.',
      items: [
        {
          title: 'Học sinh & sinh viên',
          description: 'Theo dõi tiền ăn, tiền trọ, học phí và những khoản chi nhỏ hằng ngày.',
        },
        {
          title: 'Mẹ bỉm & gia đình trẻ',
          description: 'Nhìn rõ tiền chợ, đồ cho bé và các khoản chi chung để dễ cân đối hơn.',
        },
        {
          title: 'Người làm tự do',
          description: 'Ghi lại thu nhập từng việc, tiền tip, chi phí đi lại và các khoản cần trả.',
        },
      ],
    },
    visuals: {
      eyebrow: 'Những khoảnh khắc rất thật',
      title: 'Mỗi khoản nhỏ đều đáng được nhìn rõ.',
      description:
        'Dù bạn đang đi học, vun vén gia đình hay làm việc tự do, Heo Xinh giúp việc ghi thu chi trở thành một thói quen nhẹ nhàng mỗi ngày.',
      heroAlt: 'Một người dùng Heo Xinh ghi lại thu chi bằng điện thoại và sổ tay.',
      studentAlt: 'Một sinh viên ghi khoản chi hằng ngày bằng điện thoại.',
      familyAlt: 'Một phụ huynh theo dõi chi tiêu gia đình bằng Heo Xinh.',
    },
    steps: {
      eyebrow: 'Bắt đầu chỉ với 3 bước',
      title: 'Bình tĩnh hơn với tiền của mình, từ hôm nay.',
      items: [
        {
          title: 'Tạo tài khoản',
          description: 'Chỉ cần vài thông tin cơ bản để có cuốn sổ thu chi riêng.',
        },
        {
          title: 'Ghi khoản đầu tiên',
          description: 'Ví dụ: “Chạy Bee 200.000 đ” hoặc “Nước mía 10.000 đ”.',
        },
        {
          title: 'Xem lại và chủ động',
          description: 'Từng khoản nhỏ sẽ cho bạn một bức tranh lớn hơn về tài chính.',
        },
      ],
    },
    faq: {
      eyebrow: 'Câu hỏi thường gặp',
      title: 'Bắt đầu thật nhẹ nhàng.',
      items: [
        {
          question: 'Heo Xinh phù hợp với ai?',
          answer:
            'Ứng dụng được thiết kế cho học sinh, sinh viên, mẹ bỉm, gia đình trẻ và người làm tự do muốn ghi lại tiền vào - ra thật đơn giản.',
        },
        {
          question: 'Tôi có phải tạo nhiều tài khoản ngân hàng trong ứng dụng không?',
          answer:
            'Không. Bạn chỉ cần ghi khoản thu hoặc chi. Nếu muốn, bạn có thể lưu nguồn thanh toán như tiền mặt, MoMo hay ngân hàng để tiện đối chiếu sau này.',
        },
        {
          question: 'Tôi có thể dùng để theo dõi nợ không?',
          answer:
            'Có. Bạn có thể lưu các khoản nợ, tiền đã trả và theo dõi phần còn lại để chủ động hơn với kế hoạch chi tiêu.',
        },
        {
          question: 'Dữ liệu thu chi của tôi có được công khai không?',
          answer:
            'Không. Dữ liệu được gắn với tài khoản của bạn và chỉ phục vụ việc hiển thị, tổng hợp tài chính cá nhân của chính bạn. Xem thêm trong Chính sách riêng tư.',
        },
      ],
    },
    cta: {
      eyebrow: 'Bắt đầu khi bạn sẵn sàng',
      title: 'Mỗi khoản ghi lại là một bước gần hơn tới sự chủ động.',
      description: 'Không cần hoàn hảo. Chỉ cần bắt đầu bằng khoản thu hoặc chi đầu tiên.',
      action: 'Bắt đầu ghi thu chi',
    },
    footer: {
      description: 'Thu chi rõ ràng, sống nhẹ nhàng.',
      privacy: 'Chính sách riêng tư',
      support: 'Hỗ trợ',
    },
  },
  en: {
    homeLabel: 'Heo Xinh home',
    navigationLabel: 'Main navigation',
    navigation: {
      features: 'Features',
      audience: 'For you',
      questions: 'FAQ',
    },
    login: 'Sign in',
    startFree: 'Start for free',
    hero: {
      eyebrow: 'A lighter money journal for every day',
      title: 'Clear finances, lighter living.',
      description:
        'Record an income or expense in seconds. Heo Xinh helps you see your month clearly and unwind with a light strategy game.',
      primaryAction: 'Create my money journal',
      secondaryAction: 'See how it works',
      note: 'Easy to use on phones, tablets, and computers.',
      previewLabel: 'Illustration of the financial overview screen',
    },
    preview: {
      currentMonth: 'This month',
      currentMonthValue: 'August 2026',
      balance: 'Money left',
      balanceChange: '+ ₫320,000 from last week',
      income: 'Income',
      expense: 'Expenses',
      recent: 'Recent records',
      incomeItem: 'Bee driving',
      expenseItem: 'Groceries',
    },
    features: {
      eyebrow: 'Simple enough for every day',
      title: 'You do not need to be a finance expert to manage money.',
      description:
        'Start with familiar moments: a ride, a drink, groceries, or a salary you have just received.',
      items: [
        {
          title: 'Quick, without the clutter',
          description:
            'Choose income or expense, enter an amount and category. Your record is done.',
        },
        {
          title: 'See your month at a glance',
          description: 'Know what came in, what it was spent on, and how much is left this month.',
        },
        {
          title: 'Flexible around your life',
          description:
            'Add cash, MoMo, or bank details when you want to reconcile later; complex account management is never required.',
        },
      ],
    },
    audience: {
      eyebrow: 'One small tool, many real lives',
      title: 'Heo Xinh supports your own way of living.',
      items: [
        {
          title: 'Students',
          description: 'Track meals, rent, tuition, and everyday small expenses.',
        },
        {
          title: 'Parents & young families',
          description: 'See groceries, baby essentials, and shared costs more clearly.',
        },
        {
          title: 'Freelancers',
          description: 'Record income per job, tips, travel costs, and upcoming payments.',
        },
      ],
    },
    visuals: {
      eyebrow: 'Made for real life',
      title: 'Every small record deserves clarity.',
      description:
        'Whether you study, care for a family, or work independently, Heo Xinh makes money tracking a light daily habit.',
      heroAlt: 'A Heo Xinh user recording finances with a phone and notebook.',
      studentAlt: 'A student recording an everyday expense on a phone.',
      familyAlt: 'A parent reviewing a household budget with Heo Xinh.',
    },
    steps: {
      eyebrow: 'Start in three steps',
      title: 'Feel calmer about your money, starting today.',
      items: [
        {
          title: 'Create an account',
          description: 'A few basic details give you a personal money journal.',
        },
        {
          title: 'Record your first item',
          description: 'For example: “Bee driving ₫200,000” or “Sugarcane juice ₫10,000”.',
        },
        {
          title: 'Review and take control',
          description: 'Small records create a clearer picture of your finances.',
        },
      ],
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Start gently.',
      items: [
        {
          question: 'Who is Heo Xinh for?',
          answer:
            'It is designed for students, parents, young families, and freelancers who want a simple record of money coming in and going out.',
        },
        {
          question: 'Do I need to create multiple bank accounts in the app?',
          answer:
            'No. You only need to record income or expenses. If helpful, you can save cash, MoMo, or bank as a payment source for later reconciliation.',
        },
        {
          question: 'Can I use it to track debts?',
          answer:
            'Yes. Save debts, payments already made, and remaining amounts to stay ahead of your spending plan.',
        },
        {
          question: 'Is my financial information public?',
          answer:
            'No. Your financial data belongs to your account and is used only to show and summarise your personal finances. See the Privacy Policy for details.',
        },
      ],
    },
    cta: {
      eyebrow: 'Start when you are ready',
      title: 'Every record is a step closer to feeling in control.',
      description: 'It does not need to be perfect. Start with your first income or expense.',
      action: 'Start tracking money',
    },
    footer: {
      description: 'Clear finances, lighter living.',
      privacy: 'Privacy policy',
      support: 'Support',
    },
  },
};
