---
name: scan-reels
description: Quét ID Facebook Reels từ một đường dẫn Fanpage hoặc trang cá nhân, hỗ trợ lọc theo ngày đăng.
---

# Kỹ năng Quét ID Reels Facebook

Khi người dùng chọn hoặc chạy kỹ năng này, bạn hãy thực hiện các bước sau:
1. Hỏi người dùng cung cấp link Fanpage/Cá nhân cần quét (nếu họ chưa cung cấp).
2. Hỏi người dùng có muốn lọc theo khoảng thời gian không (Ví dụ: từ ngày 09/06/2026 đến ngày 11/06/2026).
3. Chạy lệnh:
   `node scan_reels.js <URL> [--since <ngày_bắt_đầu>] [--until <ngày_kết_thúc>] --headless`
   (Lưu ý: Nếu có ngày lọc, sử dụng định dạng ngày Việt Nam DD/MM/YYYY cho các tham số --since và --until).
4. Báo cáo số lượng Reels quét được và liệt kê danh sách file kết quả (.txt) được lưu trong thư mục `output/YYYY-MM-DD/`.
