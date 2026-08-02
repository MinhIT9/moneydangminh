1. Khi đang code hằng ngày
npm run dev

Sau đó mở:

http://localhost:3000
hoặc: https://unpatiently-unintruded-rylie.ngrok-free.dev

Luồng làm việc:

Sửa code
→ Ctrl + S
→ Next.js tự cập nhật

Không cần chạy:

npm run build

và cũng không cần chạy:

npm run prod
2. Khi vừa tải source hoặc Prisma bị lỗi

Chạy:

npm run dev:fresh

Lệnh này thực hiện:

Prisma generate
→ Next.js development server

Chỉ cần dùng khi:

Máy mới tải source về.
Vừa xóa node_modules.
Prisma Client chưa được tạo.
Có lỗi không tìm thấy Prisma Client.
Vừa thay đổi cấu hình generate của Prisma.

Còn ngày thường vẫn dùng:

npm run dev
3. Khi sửa schema.prisma

Ví dụ bạn thêm bảng game, trận đấu hoặc bảng xếp hạng:

model GameMatch {
  id        Int      @id @default(autoincrement())
  gameType  String
  createdAt DateTime @default(now())
}

Chạy:

npm run db:migrate

Prisma sẽ:

Tạo migration
→ cập nhật database development
→ tạo lại Prisma Client

Trong Prisma 7, prisma migrate dev không còn tự động chạy prisma generate, nên script trên chủ động generate lại sau migration.

Prisma sẽ hỏi tên migration, chẳng hạn:

add-game-match

Sau đó tiếp tục chạy web:

npm run dev
4. Kiểm tra code trước khi đưa lên production

Chạy:

npm run check

Nó kiểm tra lần lượt:

ESLint
→ TypeScript
→ Prettier

Nếu muốn tự sửa định dạng:

npm run format

Từ Next.js 16, next build không còn tự chạy lint, nên giữ riêng lệnh check là hợp lý.

5. Build thử production
npm run build

Bạn không cần tự chạy db:generate vì npm tự chạy:

prebuild
→ db:generate
→ next build

Sau khi build thành công:

npm start

Luồng đầy đủ:

npm run build
npm start
6. Gộp migration, build và start

Khi server chưa chạy hoặc bạn đã tắt bản cũ:

npm run prod

Lệnh này thực hiện:

prisma migrate deploy
→ prisma generate
→ next build
→ next start

prisma migrate deploy chỉ áp dụng các migration đang chờ và phù hợp cho production; không nên dùng prisma migrate dev trên database thật.

Lưu ý

Nếu bản production cũ vẫn đang chạy ở cổng 3000, npm run prod có thể báo:

EADDRINUSE: address already in use

Khi đó phải tắt tiến trình cũ trước:

Ctrl + C
npm run prod
7. Seed tài khoản admin

Chạy:

npm run db:seed-admin

Lệnh này:

Generate Prisma Client
→ chạy scripts/seed-admin.ts

Nên thiết kế script seed theo kiểu:

Admin chưa tồn tại → tạo mới
Admin đã tồn tại → bỏ qua hoặc cập nhật

Như vậy chạy lại nhiều lần không tạo tài khoản trùng.

8. Quy trình sử dụng dễ nhớ
Làm web hằng ngày
npm run dev
Sửa database/schema
npm run db:migrate
npm run dev
Kiểm tra toàn bộ code
npm run check
Chạy thử production
npm run build
npm start
Production lần đầu hoặc server đã dừng
npm run prod
Máy mới hoặc Prisma lỗi
npm run dev:fresh
Bảng nhớ nhanh
Tình huống	Lệnh
Code hằng ngày	npm run dev
Prisma chưa generate	npm run dev:fresh
Sửa schema.prisma	npm run db:migrate
Kiểm tra code	npm run check
Format code	npm run format
Build production	npm run build
Chạy bản đã build	npm start
Migration + build + start	npm run prod
Tạo tài khoản admin	npm run db:seed-admin

Bộ này không phải chạy deploy trước khi dùng dev. Hai môi trường tách biệt:

npm run dev
= môi trường đang phát triển, sửa là cập nhật

npm run build + npm start
= môi trường production, sửa code phải build lại