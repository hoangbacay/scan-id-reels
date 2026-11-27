# Hướng Dẫn Sử Dụng Công Cụ Quét ID Reels Facebook

Công cụ này sử dụng thư viện **Playwright** để tự động mở trình duyệt, truy cập trang Reels của một Fanpage/Cá nhân, tự động cuộn trang (scroll) xuống dưới để tải thêm video và thu thập toàn bộ các **Reel IDs**.

Kết quả sẽ được lưu vào thư mục con đặt tên theo ngày quét dạng `output/YYYY-MM-DD/` (Ví dụ: `output/2026-06-11/`) dưới dạng các file sau:
1. File `_ids_all.txt`: Chứa toàn bộ danh sách ID đã quét được.
2. Các file chia nhỏ `_ids_part1.txt`, `_ids_part2.txt`, ... (mỗi file chứa tối đa **50 ID**): Giúp anh dễ dàng mở từng file, ấn `Ctrl + A` rồi `Ctrl + C` để copy trực tiếp tạo đối tượng trên Trình quản lý quảng cáo của Meta.

---

## Cách chạy công cụ trên máy của anh:

### Bước 1: Cài đặt trong thư mục dự án

Mở terminal tại thư mục dự án. Dùng Node.js 18 trở lên, sau đó chạy:

    npm ci
    npx playwright install chromium

Chạy npm test để kiểm tra bộ lọc ngày cục bộ.

### Bước 2: Chạy lệnh quét Reels

**Cách 1: Quét toàn bộ (không giới hạn thời gian)**
```bash
node scan_reels.js <Đường-dẫn-trang-reels>
```

**Cách 2: Quét kèm bộ lọc khoảng thời gian (YYYY-MM-DD, DD/MM/YYYY hoặc DD-MM-YYYY)**
- `--since <ngày-bắt-đầu>`: Lấy các video đăng từ ngày này trở về sau.
- `--until <ngày-kết-thúc>`: Lấy các video đăng từ ngày này trở về trước.

*Ví dụ: Quét các video từ ngày 09/06/2026 đến ngày 11/06/2026:*
```bash
node scan_reels.js https://www.facebook.com/LeQuocLongMKT/ --since 09/06/2026 --until 11/06/2026
```

> [!TIP]
> **Tối ưu hóa thời gian quét:** Khi dùng `--since`, script sẽ tự động kiểm tra ngày đăng của các Reels. Ngay khi phát hiện video có ngày đăng cũ hơn mốc `--since`, script sẽ **tự động dừng cuộn trang** và dừng quét ngay lập tức, tiết kiệm thời gian đáng kể cho anh.

### Bước 3: Xem kết quả
Khi quét hoàn tất, trình duyệt sẽ tự đóng. Hãy mở thư mục `output/<ngày_quét>/` (Ví dụ: `output/2026-06-11/`) để lấy các file `.txt` danh sách ID.

---

## Các tính năng ưu việt của script này:
- **Tự động bypass chặn đăng nhập:** Khi không đăng nhập, Facebook thường hiển thị một thông báo bắt đăng nhập và khóa cuộn trang. Script này đã được tích hợp tính năng tự động đóng các hộp thoại chặn và ép trình duyệt cho phép cuộn bình thường.
- **Tốc độ tải tối ưu:** Tự động chờ tải tài nguyên và cuộn trang liên tục đến khi hết nội dung mới.
- **Tự động lọc trùng:** Đảm bảo mỗi Reels chỉ xuất hiện 1 lần duy nhất trong file kết quả.

---

## Bypass giới hạn cuộn nâng cao bằng Cookies (Khuyên dùng cho các trang lớn):
Facebook giới hạn tài khoản khách vãng lai (không đăng nhập) chỉ được xem tối đa khoảng **50 - 70 Reels**. Để quét được nhiều hơn (hoặc toàn bộ hàng trăm Reels của một trang lớn), anh nên sử dụng cookie tài khoản Facebook của mình:

1. Cài đặt tiện ích mở rộng xuất cookie trên Chrome/Edge (Ví dụ: **EditThisCookie** hoặc **Get cookies.txt LOCALLY**).
2. Đăng nhập vào Facebook trên trình duyệt của anh.
3. Sử dụng tiện ích mở rộng để xuất cookies dưới định dạng **JSON**.
4. Tạo một file tên là `cookies.json` nằm trong thư mục gốc của dự án này (`E:\100X\Scan ID Reels\cookies.json`) và dán toàn bộ nội dung JSON vừa copy vào đó.
5. Chạy lại lệnh quét. Script sẽ tự động nhận diện file `cookies.json` và chạy ở chế độ đăng nhập để quét không giới hạn!
