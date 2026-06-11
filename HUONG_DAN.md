# Hướng Dẫn Sử Dụng Công Cụ Quét ID Reels Facebook

Công cụ này sử dụng thư viện **Playwright** để tự động mở trình duyệt, truy cập trang Reels của một Fanpage/Cá nhân, tự động cuộn trang (scroll) xuống dưới để tải thêm video và thu thập toàn bộ các **Reel IDs**.

Kết quả sẽ được lưu vào thư mục con đặt tên theo ngày quét dạng `output/YYYY-MM-DD/` (Ví dụ: `output/2026-06-11/`) dưới dạng các file sau:
1. File `_ids_all.txt`: Chứa toàn bộ danh sách ID đã quét được.
2. Các file chia nhỏ `_ids_part1.txt`, `_ids_part2.txt`, ... (mỗi file chứa tối đa **50 ID**): Giúp anh dễ dàng mở từng file, ấn `Ctrl + A` rồi `Ctrl + C` để copy trực tiếp tạo đối tượng trên Trình quản lý quảng cáo của Meta.

---

## Cách chạy công cụ trên máy của anh:

### Bước 1: Mở terminal/CMD tại thư mục này
Nhấp chuột phải vào thư mục `Scan ID Reels` và chọn **Open in Terminal** (hoặc mở CMD rồi gõ `cd "E:\100X\Scan ID Reels"`).

### Bước 2: Chạy lệnh quét Reels

**Cách 1: Quét toàn bộ (không giới hạn thời gian)**
```bash
node scan_reels.js <Đường-dẫn-trang-reels>
```

**Cách 2: Quét kèm bộ lọc khoảng thời gian (Định dạng ngày YYYY-MM-DD)**
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
- **Tự động bypass chặn đăng nhập:** Khi không đăng nhập, Facebook thường hiển thị một thông báo bắt đăng nhập và khóa cuộn trang. Script này đã được tích hợp tính năng ẩn các hộp thoại chặn và ép trình duyệt cho phép cuộn bình thường.
- **Tốc độ tải tối ưu:** Tự động chờ tải tài nguyên và cuộn trang liên tục đến khi hết nội dung mới.
- **Tự động lọc trùng:** Đảm bảo mỗi Reels chỉ xuất hiện 1 lần duy nhất trong file kết quả.
