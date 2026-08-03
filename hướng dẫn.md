# Hướng dẫn chạy Heo Xinh

Tài liệu này dùng cho môi trường PowerShell trên Windows. Dự án cần Node.js `20.19+`, MariaDB và file `.env` hợp lệ.

> [!IMPORTANT]
> Không đưa mật khẩu, `DATABASE_URL` hoặc `SESSION_SECRET` vào Git. Chỉ chỉnh chúng trong file `.env` cục bộ hoặc biến môi trường của máy chủ.

## Chọn lệnh nhanh

| Tình huống                                | Lệnh cần dùng           |
| ----------------------------------------- | ----------------------- |
| Code hằng ngày                            | `npm run dev`           |
| Prisma Client lỗi hoặc vừa tải source     | `npm run dev:fresh`     |
| Sửa `prisma/schema.prisma` khi phát triển | `npm run db:migrate`    |
| Xem migration đã áp dụng chưa             | `npm run db:status`     |
| Kiểm tra code trước khi đưa lên server    | `npm run check`         |
| Tự format code và Markdown                | `npm run format`        |
| Build thử bản production                  | `npm run build`         |
| Chạy bản đã build                         | `npm run start`         |
| Deploy thủ công: migration + build        | `npm run deploy`        |
| Deploy và chạy ngay trong một terminal    | `npm run prod`          |
| Tạo tài khoản quản trị đầu tiên           | `npm run db:seed-admin` |

## 1. Bắt đầu lần đầu

```powershell
npm install
Copy-Item .env.example .env
```

Mở `.env`, điền thông tin MariaDB và `SESSION_SECRET`, sau đó áp dụng các migration đã có:

```powershell
npm run db:deploy
npm run dev
```

Mở ứng dụng cục bộ tại [http://localhost:3000](http://localhost:3000).

Nếu truy cập `npm run dev` qua ngrok, thêm hostname đáng tin cậy vào `.env` rồi khởi động lại dev server:

```dotenv
ALLOWED_DEV_ORIGINS=ten-mien-cua-ban.ngrok-free.app
```

Chỉ nhập hostname, không nhập đường dẫn. Có thể khai báo nhiều hostname và phân tách bằng dấu phẩy. Không dùng wildcard rộng vì dev server chứa tài nguyên nội bộ chỉ dành cho phát triển.

`npm install` tự chạy `postinstall`, vì vậy Prisma Client sẽ được generate sẵn. `db:deploy` chỉ áp dụng migration đã nằm trong thư mục `prisma/migrations`.

## 2. Code hằng ngày

```powershell
npm run dev
```

Giữ terminal này mở. Sau khi sửa file và nhấn `Ctrl + S`, Next.js tự cập nhật trang qua Fast Refresh. Không cần chạy `build` hoặc `prod` sau mỗi lần sửa code.

Nếu vừa thay đổi `ALLOWED_DEV_ORIGINS`, bắt buộc dừng dev server bằng `Ctrl + C` và chạy lại `npm run dev`.

## 3. Khi Prisma Client lỗi hoặc vừa tải source

Trước tiên, dừng server phát triển đang chạy bằng `Ctrl + C`, rồi chạy:

```powershell
npm run dev:fresh
```

Lệnh này generate lại Prisma Client rồi mở Next.js development server. Dùng khi vừa xóa `node_modules`, vừa nhận source mới hoặc gặp lỗi không tìm thấy Prisma Client.

## 4. Khi sửa `prisma/schema.prisma`

Chỉ dùng quy trình này ở môi trường phát triển:

```powershell
# Dừng npm run dev nếu nó đang chạy.
npm run db:migrate
```

Prisma sẽ hỏi tên migration, ví dụ `add-budget-table`. Script sẽ:

1. Tạo migration mới.
2. Áp dụng migration vào database development.
3. Generate lại Prisma Client.

Sau đó chạy lại ứng dụng:

```powershell
npm run dev
```

> [!WARNING]
> Không chạy `npm run db:migrate` trên database production. Production chỉ dùng `npm run db:deploy` để áp dụng migration đã được tạo và kiểm tra trong source.

## 5. Kiểm tra và build production

Trước khi đưa code lên server:

```powershell
npm run check
npm run build
```

`check` chạy ESLint, TypeScript và Prettier. Nếu Prettier báo lỗi, chạy:

```powershell
npm run format
```

`build` tự chạy `prebuild`. Quy trình này xóa các đầu ra build cũ như
`.next/diagnostics`, `.next/server` và `.next/node_modules`, nhưng bảo toàn
riêng `.next/cache`. Lệnh dọn dùng `rimraf` với cơ chế retry riêng cho Windows
để chờ các khóa tệp tạm thời được giải phóng, trong khi cache build vẫn được
tái sử dụng.

Trước khi build, phải dừng mọi terminal đang chạy `npm run dev` hoặc
`npm run start` bằng `Ctrl + C`. Windows không cho phép `rimraf` xóa một tệp
vẫn đang bị tiến trình khác khóa.

Nếu cần chạy riêng bước dọn nhỏ hoặc dọn toàn bộ kết quả build:

```powershell
npm run clean:diagnostics # Chỉ xóa .next/diagnostics, vẫn giữ cache
npm run clean:build       # Xóa đầu ra build cũ, bảo toàn .next/cache
npm run clean             # Xóa toàn bộ .next, chỉ dùng khi cần build sạch
```

Sau khi build thành công, thử bản production tại máy:

```powershell
npm run start
```

## 6. Deploy thủ công

Khi máy chủ đã có source, `.env` và dependencies:

```powershell
npm run deploy
npm run start
```

`deploy` thực hiện theo thứ tự:

```text
prisma migrate deploy → prisma generate → next build
```

Nếu bạn chạy trực tiếp trong một terminal, có thể gộp hai bước:

```powershell
npm run prod
```

`npm run prod` giữ terminal để phục vụ website. Nếu cổng `3000` đang được dùng, hãy dừng tiến trình cũ trước bằng `Ctrl + C`, rồi chạy lại lệnh. Khi triển khai ổn định lâu dài, nên để PM2, Docker hoặc dịch vụ hosting quản lý lệnh `npm run start`.

## 7. Kiểm tra database và tạo admin

Kiểm tra trạng thái migration:

```powershell
npm run db:status
```

Nếu cần tạo tài khoản quản trị đầu tiên, cấu hình các biến `ADMIN_*` trong `.env`, rồi chạy:

```powershell
npm run db:seed-admin
```

Sau khi tạo xong, xóa `ADMIN_PASSWORD` khỏi `.env` nếu không còn cần dùng.

## Quy trình dễ nhớ

```text
Code mỗi ngày        npm run dev
Đổi database/schema  npm run db:migrate → npm run dev
Trước production     npm run check → npm run build
Deploy production    npm run deploy → npm run start
Prisma có vấn đề     dừng dev → npm run dev:fresh
```

### Dừng terminal đang chạy npm run dev bằng Ctrl + C

Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
Select-Object OwningProcess
