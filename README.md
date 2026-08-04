# Heo Xinh

Heo Xinh — “Tiết kiệm và giải trí” — là ứng dụng ghi chép thu chi cá nhân và khu
trò chơi trí tuệ, xây bằng Next.js App Router, TypeScript, Prisma và MariaDB. Ứng dụng có landing page công khai; các trang
thu chi, danh mục, khoản nợ và cài đặt yêu cầu đăng nhập. Có thêm khu vực quản
trị để mở/đóng đăng ký và quản lý tài khoản thường. Khu Cờ Caro XO hiện là bản
game có backend MariaDB, Server Actions và API HTTP. Nước đi, phòng, tim, Elo,
bạn bè, chat, lời mời và kết quả trận đều được xác thực phía máy chủ.

Landing page V8.4 sử dụng nhận diện Heo Xinh mới với mascot heo đất, phần giới thiệu tài chính và Cờ Caro XO, nhóm đối tượng sử dụng, quy trình ba bước, FAQ và CTA responsive cho cả desktop lẫn điện thoại nhỏ.

Khu đăng nhập và đăng ký V8.5 dùng chung một auth shell responsive, có mascot thương hiệu, hỗ trợ song ngữ, liên kết hỗ trợ thực, biểu tượng trường nhập và nút hiện/ẩn mật khẩu có khả năng truy cập.

Khu tài chính có thêm **Kế hoạch thu nhập**: dự báo số tiền cần kiếm theo ngày,
tuần và tháng từ thu chi thực tế, lịch làm, khoản chi sắp tới, nợ đến hạn và vùng
đệm mong muốn. Hệ thống chỉ lưu giả định của người dùng; mọi kết quả được tính
lại từ dữ liệu mới nhất và có nút `?` giải thích tại các khái niệm dễ gây nhầm.

Backend game hiện hỗ trợ:

- Profile game tự tạo theo tài khoản và ID người chơi ổn định.
- Phòng riêng, sẵn sàng, bắt đầu trận, lời mời và chat phòng.
- Bàn 19×19 với kiểm tra lượt, ô trống, thời gian và luật thắng phía server.
- Đầu hàng và đề nghị hòa có xác nhận từ đối thủ.
- Hàng chờ đấu hạng theo cấp Caro hiện tại và hai cấp liền kề, tự loại người chơi mất kết nối.
- Trận xếp hạng có 15 giây mỗi lượt và dùng thời gian server để đồng bộ hai phía.
- Sau trận hiển thị modal kết quả; chiến thắng có hiệu ứng chúc mừng, sau đó có thể tìm đối thủ mới, sẵn sàng hiệp tiếp theo hoặc trở về sảnh.
- Tim hồi theo thời gian; điểm Elo Caro, thống kê và bảng xếp hạng lưu MariaDB độc lập với game khác.
- Kết bạn, chấp nhận/từ chối, chặn và tin nhắn trực tiếp có giới hạn tốc độ.
- API polling riêng tư tại `/api/games/*`, không cache và không index.

## Yêu cầu

- Node.js 20.19 trở lên
- MariaDB đang chạy (khuyến nghị bản hiện hành, tương thích MySQL)
- npm đi kèm Node.js

## Chạy ở máy local

1. Cài thư viện:

   ```bash
   npm install
   ```

2. Tạo tệp môi trường từ mẫu. Trên PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Trên macOS/Linux:

   ```bash
   cp .env.example .env
   ```

3. Mở `.env` và thay tất cả giá trị mẫu bằng cấu hình local của bạn. Các biến
   `DB_*`, `DATABASE_URL` và `SESSION_SECRET` là bí mật phía máy chủ, tuyệt đối
   không thêm tiền tố `NEXT_PUBLIC_` và không commit tệp `.env`.

   - `DATABASE_URL` được Prisma dùng khi tạo/chạy migration.
   - Nếu mật khẩu có ký tự đặc biệt, phải URL-encode mật khẩu trong
     `DATABASE_URL`.
   - `SESSION_SECRET` nên là chuỗi ngẫu nhiên tối thiểu 32 ký tự.
   - `NEXT_PUBLIC_APP_URL` là địa chỉ web công khai, dùng cho sitemap,
     canonical URL và ảnh chia sẻ. Local mặc định là `http://localhost:3000`.

4. Tạo database và tài khoản MariaDB riêng cho ứng dụng bằng tài khoản quản trị
   MariaDB của bạn. Chỉ cấp quyền cần thiết trên đúng database của ứng dụng;
   không dùng tài khoản `root` cho web.

5. Sinh Prisma Client và áp dụng migration có sẵn:

   ```bash
   npm run db:generate
   npm run db:deploy
   ```

   `db:deploy` chỉ áp dụng các migration đã có trong `prisma/migrations`, phù
   hợp để tạo một database mới từ source hiện tại. Khi phát triển và **có thay
   đổi schema**, dùng `npm run db:migrate -- --name mo-ta-thay-doi` để tạo
   migration mới, sau đó commit migration đó cùng mã nguồn.

6. Nếu cần một tài khoản quản trị đầu tiên, điền `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `ADMIN_PHONE` (và tùy chọn `ADMIN_DISPLAY_NAME`) vào `.env`,
   sau đó chạy một lần:

   ```bash
   npm run db:seed-admin
   ```

   Lệnh không in mật khẩu ra màn hình; sau khi hoàn thành, xóa
   `ADMIN_PASSWORD` khỏi `.env`. Không có email/mật khẩu quản trị mặc định được
   nhúng trong source.

7. Khởi chạy:

   ```bash
   npm run dev
   ```

   Mở [http://localhost:3000](http://localhost:3000), tạo tài khoản rồi bắt
   đầu ghi thu chi.

## Kiểm tra trước khi đưa lên server

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:income-plan
npm run build
```

`npm run build` dọn các đầu ra build cũ nhưng giữ `.next/cache`, rồi tự sinh
Prisma Client trước khi build. Hãy dừng `npm run dev` hoặc `npm run start`
trước khi build để Windows không giữ khóa tệp. Không sửa trực tiếp thư mục
`src/generated/prisma` vì đó là mã được tạo lại từ schema.

## Triển khai production

1. Chuẩn bị MariaDB, database riêng và một tài khoản database ít quyền nhất có
   thể. Sao lưu database trước mỗi lần chạy migration.
2. Khai báo biến môi trường tại nơi deploy; không tải hoặc commit tệp `.env`
   thật. Dùng URL HTTPS thật cho `NEXT_PUBLIC_APP_URL` và một `SESSION_SECRET`
   riêng, dài, ngẫu nhiên.
3. Cài đúng dependency đã khóa phiên bản và áp dụng migration:

   ```bash
   npm ci
   npm run db:deploy
   npm run build
   npm run start
   ```

4. Đặt ứng dụng sau reverse proxy/hosting có HTTPS. Không dùng
   `npm run db:migrate` trực tiếp trên production: lệnh này dành cho môi trường
   phát triển và có thể tạo migration mới.

## Biến môi trường

Xem đầy đủ trong [`.env.example`](.env.example). Các biến hiện có:

| Biến                                | Mục đích                              | Có thể công khai?    |
| ----------------------------------- | ------------------------------------- | -------------------- |
| `NEXT_PUBLIC_APP_URL`               | URL chuẩn của website cho SEO/chia sẻ | Có                   |
| `DB_HOST`, `DB_PORT`, `DB_NAME`     | Kết nối MariaDB ở runtime             | Không                |
| `DB_USER`, `DB_PASSWORD`            | Tài khoản MariaDB ở runtime           | Không                |
| `DATABASE_URL`                      | Kết nối Prisma cho migration          | Không                |
| `SESSION_SECRET`                    | Băm phiên đăng nhập                   | Không                |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`     | Bootstrap quản trị một lần            | Không                |
| `ADMIN_PHONE`, `ADMIN_DISPLAY_NAME` | Thông tin bootstrap quản trị          | Không                |
| `SUPPORT_EMAIL`                     | Email hiển thị trên trang hỗ trợ      | Có thể, tùy lựa chọn |

## Bảo mật và vận hành

- Không đưa mật khẩu database, khóa phiên hay tệp `.env` vào Git, log, ảnh chụp
  màn hình hoặc mã phía trình duyệt.
- Nếu một bí mật từng được chia sẻ ngoài kênh an toàn, hãy đổi/thu hồi bí mật đó
  trước khi public ứng dụng.
- Ứng dụng gửi các header bảo vệ cơ bản: chống MIME sniffing, clickjacking,
  hạn chế referrer và tắt các quyền trình duyệt không dùng đến. Dashboard,
  quản trị, đăng nhập, đăng ký và API được gắn `X-Robots-Tag: noindex`.
- Sao lưu MariaDB định kỳ, kiểm tra khả năng khôi phục và theo dõi lỗi server.
- Khi thêm tính năng upload tệp, OAuth hoặc script bên thứ ba, hãy rà soát lại
  Content Security Policy và các header trước khi bật production.

## Cấu trúc chính

```text
app/                 Route và giao diện Next.js
src/actions/         Server Actions: xác thực và nghiệp vụ tài chính
src/lib/             Kết nối DB, xác thực, validate và tiện ích
prisma/schema.prisma Mô hình dữ liệu MariaDB
prisma/migrations/   Lịch sử migration được commit
```

## Lệnh thường dùng

```bash
npm run dev          # Chạy môi trường phát triển
npm run build        # Sinh Prisma Client và build production
npm run start        # Chạy bản production đã build
npm run db:generate  # Sinh lại Prisma Client
npm run db:deploy    # Áp dụng migration hiện có
npm run db:migrate   # Tạo migration mới khi phát triển
npm run db:seed-admin # Tạo/nâng quyền tài khoản quản trị một lần
```
