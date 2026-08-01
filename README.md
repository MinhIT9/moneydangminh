# Minh Finance

Ứng dụng quản lý thu chi cá nhân bằng Flask và SQLite, giao diện SPA-like bằng Fetch API.

## Chạy development

```powershell
python -m venv .venv
.\.venv\Scripts\activate
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

Mở `http://127.0.0.1:5000/login`. Tài khoản khởi tạo: `root@dangminh.com`, mật khẩu ban đầu `Minh1111`. Hệ thống yêu cầu đổi mật khẩu; không dùng mật khẩu này cho production.

Development dùng `data/finance_dev.db`. Đặt `SECRET_KEY` bằng chuỗi ngẫu nhiên trong môi trường thực tế.

## Chạy production

Nhấp `start_prod.bat`. Script tự tạo `.venv`, cài thư viện, đặt `APP_ENV=production`, dùng `data/finance_prod.db` và chạy Waitress tại `127.0.0.1:5000`. Trước khi vận hành, đặt biến `SECRET_KEY` dài và ngẫu nhiên; đặt `HTTPS=1` khi reverse proxy HTTPS (ví dụ Caddy).

Database tự khởi tạo và không bị ghi đè. SQLite bật foreign keys, WAL và busy timeout. Root tải backup nhất quán qua SQLite Backup API trong Cài đặt.

## Chức năng hiện có

- Dashboard theo tháng với bốn biểu đồ thu/chi, nguồn thu, danh mục chi và tiến độ trả nợ.
- Giao dịch có tìm kiếm, bộ lọc, phân trang, kiểm tra danh mục và chống số dư âm.
- Phương thức thanh toán là nhãn tùy chọn (Tiền mặt, Ngân hàng, MoMo...), không quản lý số dư.
- Khoản nợ có sửa, xóa an toàn, thanh toán một phần và lịch sử thanh toán.
- Quản trị đăng ký, khóa/mở khóa, xóa người dùng và tải backup.
- Frontend tách lớp gọi API, tiện ích UI và từng màn hình trong `static/js/views`.

Ứng dụng vận hành như một sổ thu–chi: thu nhập và chi tiêu là dữ liệu chính. Phương thức thanh toán chỉ phục vụ lọc, tìm kiếm và đối chiếu; bỏ trống phương thức vẫn hợp lệ. Chuyển tiền giữa ví không được tính vì hệ thống không theo dõi số dư thực tế của ví.

## Kiểm thử

```powershell
python -m unittest -v test_smoke.py
```

## Format code

Frontend uses Prettier and Python uses Black. Install development tools once, then run:

```powershell
npm install
.venv\Scripts\python -m pip install -r requirements-dev.txt
npm run format
.venv\Scripts\python -m black .
```

Check formatting without changing files:

```powershell
npm run format:check
.venv\Scripts\python -m black --check .
```
