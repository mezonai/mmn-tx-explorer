# Mezon CSR Donation Campaign – BA & UI/UX Brief

**Phiên bản:** 1.0  
**Người soạn:** Business Analysis Team  
**Đối tượng:** UI/UX Design, Product Owner, Backend, QA

---

## 1. Mục tiêu nghiệp vụ

- Xây dựng trải nghiệm minh bạch khi gây quỹ CSR (ví dụ Quỹ Xây Trường Học).  
- Kết nối dữ liệu lỗi vi phạm trên Timesheet với chiến dịch phạt nộp quỹ.  
- Cho phép nhân viên đóng góp token MMN (Mezon) một cách chủ động và được ghi nhận.  
- Cung cấp dashboard trên Mezon Explorer để xem, tạo, quản lý các campaign và hoạt động đóng góp.

---

## 2. Bối cảnh & phạm vi

| Thành phần | Vai trò | Ghi chú |
|------------|---------|---------|
| **Timesheet Portal** | Nhân viên xác nhận giờ công và lỗi trong tuần/tháng; lựa chọn nộp phạt vào quỹ. | Các chức năng xem lỗi, xác nhận timesheet đã tồn tại. |
| **MMN Explorer (dong.mezon.ai)** | Nơi hiển thị, quản trị các chiến dịch donation; cung cấp thông tin ví nhận. | Yêu cầu thiết kế mới cho module Donation Campaign. |
| **MMN Blockchain** | Lưu trữ giao dịch token MMN, cung cấp hash/tx detail. | Đã sẵn luồng chuyển token. |

---

## 3. Persona & nhu cầu chính

- **Nhân viên (Employee Contributor)**
  - Kiểm tra lỗi timesheet, biết được số tiền phạt cần nộp.
  - Quyết định nộp phạt vào quỹ xây trường ngay trên portal.
  - Nhận xác nhận đã thanh toán để hệ thống khóa lỗi.

- **Quản trị viên CSR (CSR Admin)**
  - Tạo chiến dịch mới, thiết lập mục tiêu, hình ảnh, ngày kết thúc.
  - Sinh ví nhận token (keypair) cho từng campaign.
  - Theo dõi số tiền đã nhận, top người đóng góp.

- **Khách truy cập (Guest/Employee Viewer)**
  - Xem danh sách chiến dịch.
  - Chọn campaign để xem chi tiết, recent activity, thông tin ví để donate.
  - Có thể tự donate thêm ngoài khoản phạt (nếu thích).

---

## 4. Luồng nghiệp vụ chính

### 4.1 Nhân viên xác nhận timesheet & nộp phạt
1. Nhân viên đăng nhập Timesheet Portal, xem màn hình xác nhận tuần/tháng.  
2. Danh sách lỗi hiển thị rõ ngày, loại lỗi, mô tả, số token phạt.  
3. Nhân viên tick “Tôi muốn nộp phạt vào Quỹ Xây Trường”.  
4. Hệ thống hiển thị CTA **“Đóng góp ngay trên dong.mezon.ai”** -> mở tab mới tới campaign cụ thể.  
5. Sau khi chuyển token thành công (user thao tác trên Explorer), Timesheet nhận callback/webhook hoặc nhân viên upload mã giao dịch.  
6. Timesheet đánh dấu lỗi đã thanh toán, cập nhật số tiền phạt còn lại (nếu thiếu).

### 4.2 Admin tạo chiến dịch mới trên Explorer
1. Admin vào Mezon Explorer > Donation Campaign > **Create campaign**.  
2. Điền form: tên chiến dịch, mô tả, mục tiêu, ảnh banner, ngày kết thúc, tag liên quan.  
3. Nhấn **Generate wallet** để lấy address/private key (hiển thị cảnh báo bảo mật).  
4. Submit -> campaign xuất hiện trong danh sách, trạng thái “Draft” hoặc “Active”.  
5. Admin có thể lấy QR/đường dẫn chia sẻ cho nhân viên.

### 4.3 Người dùng xem chi tiết campaign
1. Truy cập `/campaigns`.  
2. Chọn card -> đi tới trang chi tiết.  
3. Xem tổng số tiền, tiến độ, số người đóng góp, các giao dịch gần nhất.  
4. Nhấn **Donate now** -> mở modal hoặc deeplink tới ví/ứng dụng chuyển token.  
5. Có thể sao chép địa chỉ ví, quét QR, hoặc xem hướng dẫn.

---

## 5. Yêu cầu chức năng & UI

### 5.1 Timesheet Portal – Timesheet Confirmation Page
- Header nêu rõ chu kỳ (ví dụ “Xác nhận Timesheet - Tuần 41 · 07-13/10/2025”).  
- Summary card: tổng số lỗi, tổng tiền phạt dự kiến (token MMN).  
- Bảng lỗi:
  - Cột: Ngày | Loại lỗi | Mô tả | Mức phạt (MMN) | Trạng thái.  
  - Có tooltip mô tả chi tiết loại lỗi.  
- Checkbox “Tôi muốn nộp phạt vào Quỹ Xây Trường”.  
- CTA chính (hiển thị khi tick): **Đóng góp ngay trên dong.mezon.ai**.  
- Trạng thái sau khi xác nhận:
  - Banner trạng thái “Đã ghi nhận nộp phạt 120 MMN vào Quỹ Xây Trường”.  
  - Nếu thiếu tiền phạt, hiển thị cảnh báo và số còn lại.

### 5.2 Explorer – Campaign List (`/campaigns`)
- Hero banner với headline “Mezon Donation Campaigns” và mô tả ngắn.  
- CTA phụ: “Học cách đóng góp”, CTA chính cho admin (ẩn/disable với user thường): **+ Create campaign**.  
- Grid card (≥3 cột desktop, 1–2 cột mobile) gồm:
  - Tên chiến dịch, badge trạng thái (`Active`, `Draft`, `Closed`).  
  - Mô tả ngắn tối đa 2 dòng.  
  - Goal vs. Raised (hiển thị số token và %).  
  - Progress bar gradient theo brand.  
  - Meta: số người đóng góp, ngày kết thúc còn lại.  
  - Action: **View details**.

### 5.3 Explorer – Create Campaign (`/campaigns/new`)
- Form nhiều bước hoặc 1 trang (ưu tiên 1 trang với nhóm field).  
- Các field bắt buộc: Campaign name, Description, Fundraising goal (MMN), Start date (auto = now), End date.  
- Field tùy chọn: Image upload, Tags, Stakeholder contact.  
- Khu vực Generate wallet:
  - Button **Generate wallet** -> hiển thị modal với Address + Private key + QR (ẩn private sau khi đóng).  
  - Tooltip cảnh báo: “Lưu trữ private key an toàn. Hệ thống không lưu trữ lại”.  
- Summary sidebar bên phải (desktop) hiển thị preview card.  
- Action buttons: **Save draft**, **Publish now** (disabled nếu thiếu thông tin/ ví).

### 5.4 Explorer – Campaign Detail (`/campaigns/:id`)
- Header hero gồm banner, breadcrumbs, badge trạng thái.  
- Summary section (card lớn):
  - Tổng số token đã nhận, Goal, % đạt được.  
  - Số người đóng góp, số giao dịch, thời gian còn lại.  
  - Wallet address + nút copy + link “View on Explorer”.  
  - QR code để scan ví.  
  - CTA chính: **Donate now**.  
- Tab hoặc section điều hướng phụ:
  - **Recent activity** (bảng giao dịch): Người gửi, Số lượng, Thời gian, Tx hash (link).  
  - **Top contributors**: bảng xếp hạng 3-5 người, hiển thị số token và phần trăm tổng.  
  - **About**: nội dung mô tả đầy đủ, hình ảnh, cách sử dụng quỹ.
- Section phụ:
  - “Impact stories” (optional).  
  - “Liên hệ quản trị chiến dịch”.

### 5.5 States & messaging
- Loading: skeleton cards, skeleton rows.  
- Empty state: illustration + CTA “Be the first to donate”.  
- Error state: toast hoặc inline banner (ví dụ khi không load được giao dịch).  
- Success toast khi copy address, generate wallet, publish campaign.

---

## 6. Dữ liệu & tích hợp

| API | Method | Mục đích | Ghi chú UI |
|-----|--------|----------|------------|
| `/api/campaigns` | GET | Lấy danh sách campaign | Phân trang, lọc theo trạng thái. |
| `/api/campaigns/:id` | GET | Lấy chi tiết campaign | Trả về summary + nội dung tab. |
| `/api/campaigns` | POST | Tạo campaign mới | Yêu cầu admin role + thông tin ví. |
| `/api/campaigns/:id/wallet` | POST | Generate keypair | Trả về address, private key (one-time). |
| `/api/campaigns/:id/donations` | GET | Lấy danh sách giao dịch | Hỗ trợ sort theo thời gian, limit. |
| `/api/timesheet/donation-status` | PATCH | Cập nhật trạng thái đóng phạt | Gọi từ Timesheet sau khi nhận callback. |

Các trạng thái campaign đề xuất: `Draft`, `Active`, `Completed`, `Closed`.  
Đơn vị tiền tệ hiển thị: token **MMN** (có thể kèm quy đổi VND/USD nếu backend cung cấp).

---

## 7. Checklist UI/UX

- Đồng bộ visual (typography, color, spacing) với `v3/index.html`: dark mode, rounded-3xl card, gradient progress bar, shadow mềm.  
- Responsive: mobile-first, tối ưu breakpoint `sm`, `md`, `lg`, `xl`.  
- Accessibility: contrast ≥ WCAG AA, focus state rõ, copy address dùng aria-live.  
- Localization: text chuẩn tiếng Việt nhưng dễ chuyển đổi sang tiếng Anh trong tương lai.  
- Document final deliverables: wireframe (low/high fidelity), UI kit component, flow diagram, prototype cho 3 luồng chính.

---

## 8. Hạng mục còn mở (Open Questions)

1. Cơ chế xác thực để phân biệt nhân viên (Timesheet) vs admin (Explorer).  
2. Webhook từ blockchain: backend có cung cấp hay cần nhân viên tự dán tx hash?  
3. Chính sách hiển thị private key: có cần bắt buộc tải file CSV/JSON lưu trữ?  
4. Có cần dashboard tổng hợp đa chiến dịch (analytics) cho admin?  
5. Hỗ trợ campaign đa ngôn ngữ hay chỉ tiếng Việt ở giai đoạn 1?

> UI/UX team cần xác nhận các điểm mở để chốt flow chi tiết và tạo prototype phù hợp với backend timeline.

---

**Tài liệu này là đầu vào cho sprint thiết kế Donation Campaign.**  
Vui lòng cập nhật lại khi có thay đổi nghiệp vụ hoặc bổ sung từ PO/Stakeholder.
