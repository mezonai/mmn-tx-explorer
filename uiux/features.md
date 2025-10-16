# 🧭 MEZON MAINNET EXPLORER – UPDATED FUNCTIONAL SPEC (v2.0)

**Prepared by:** Business Analysis Team  
**Audience:** UI/UX Design, Backend, Product Owner, QA  

---

## 🎯 Mục tiêu dự án

Mezon Mainnet Explorer (Public & Private Mode) là hệ thống **theo dõi – tra cứu – giao dịch token Mezon (MEZ)**, hướng đến hai mục tiêu song song:

1. **Giữ tính minh bạch cao của hệ thống blockchain** (người dùng có thể tra cứu balance, transaction, donation, hoạt động công khai).  
2. **Cung cấp các tính năng mở rộng hệ sinh thái Mezon**, bao gồm:
   - Giao dịch & donation minh bạch.
   - Tích hợp mua sắm (Cobar.vn).
   - Tích hợp game (Mezon Game).
   - Các dịch vụ cộng đồng: Give Coffee, Lì Xì, Stake, Swap.

---

## 👥 1. Phân loại người dùng

| Role | Quyền truy cập | Mô tả |
|------|----------------|-------|
| **Guest (Public User)** | Toàn quyền xem dữ liệu công khai (balance, transaction, block, donation list, v.v.) | Xem minh bạch toàn mạng |
| **Authenticated User** | Có thêm quyền tương tác (transfer, stake, swap, gửi lì xì, donate, mua hàng, ... ) | Cần đăng nhập qua OAuth Mezon |
| **Admin (Internal)** | Theo dõi, audit hệ thống, dashboard tổng | Quản trị nội bộ NCC / Mezon |

---

## 🔐 2. Login & Access

- Hệ thống **tích hợp OAuth Login với Mezon** → chỉ cần **1 nút “Login with Mezon”**.  
- Không có trang login riêng.  
- Sau khi login → hiển thị avatar + tên user trên thanh menu.

**Button:**  
> “🔐 Login with Mezon” → redirect OAuth → trả JWT session token.

---

## 🧭 3. Cấu trúc Menu Mới

Cấu trúc menu được **gom nhóm hợp lý** để tránh rối, hiển thị dạng **menu cha – con** (dropdown hoặc sidebar tree).  
Gợi ý hiển thị theo kiểu **3 nhóm chính: “Explorer”, “Finance”, “Community”**, cộng thêm “Ecosystem” (Cobar & Games).

---

### 🌐 Explorer
> **Chức năng minh bạch, tra cứu dữ liệu on-chain**

| Menu | Mô tả | Visibility |
|------|--------|-------------|
| **Dashboard** | Thống kê toàn mạng: total block, tx, wallet, avg block time, donation volume | Public |
| **Blocks** | Danh sách block, block detail (height, timestamp, tx count, miner, hash) | Public |
| **Transactions** | Danh sách giao dịch (paging), filter theo status, date | Public |
| **Accounts** | Top account theo balance, transaction count | Public |
| **Account Detail** | Xem chi tiết ví (balance, tx count, tx history, donation history, stake info) | Public + Private |
| **Search** | Tìm theo transaction hash, block number, wallet address | Public |

---

### 💰 Finance
> **Các tính năng tài chính sử dụng Mezon token**

| Menu | Mô tả | Access |
|------|--------|---------|
| **Stake** | Gửi token để nhận lãi | Login |
| **Swap** | Hoán đổi token (MEZ ↔ CoffeeToken / USD value) | Login |
| **Give Coffee** | Gửi token như quà tặng hoặc thanh toán Stripe | Login |
| **Donate** | Gửi tiền cho streamer hoặc tổ chức từ thiện | Public (minh bạch) + Login (thực hiện giao dịch) |
| **Lì Xì** | Tạo gói lì xì, generate QR, chia sẻ cho nhiều người nhận | Login |

---

### 🫶 Community
> **Tính năng gắn kết, truyền cảm hứng và chia sẻ**

| Menu | Mô tả | Access |
|------|--------|---------|
| **Donation Feed** | Danh sách công khai các chiến dịch hoặc streamer nhận donate, thống kê tổng donation | Public |
| **Top Supporters** | Bảng xếp hạng người donate hoặc give coffee nhiều nhất | Public |
| **My Activity** | User xem toàn bộ lịch sử tặng / nhận / stake / swap / lì xì | Login |
| **Notifications** | Hiển thị các event: nhận quà, donate mới, reward stake, ... | Login |

---

### 🧩 Ecosystem
> **Kết nối với các sản phẩm khác trong hệ sinh thái Mezon**

| Menu | Mô tả | Visibility |
|------|--------|-------------|
| **Cobar.vn** | Tích hợp sàn thương mại điện tử chấp nhận Mezon token, link trực tiếp `https://cobar.vn` | Public |
| **Mezon Game** | Danh sách các game trên hệ sinh thái Mezon tích hợp MEZ token | Public |
| **Developers (optional)** | API docs, token integration guides | Public |

---

### ⚙️ Settings
> **Quản lý tài khoản & bảo mật**

| Menu | Mô tả |
|------|--------|
| **Profile** | Thông tin user (tên, email, ví) |
| **2FA Security** | Kích hoạt / tắt bảo mật 2 lớp |
| **Privacy Notice** | Chính sách dữ liệu và minh bạch |
| **Logout** | Đăng xuất khỏi OAuth session |

---

## 💎 4. Chức năng chi tiết

### 4.1. Account & Transparency

- **Tra cứu ví của người khác:**  
  - Cho phép xem balance, tx count, tx list, donation list, staking status.  
  - Dữ liệu hiển thị công khai (như blockchain explorer truyền thống).  
- **Minh bạch donation:**  
  - Các giao dịch donation có tag `donate=TRUE` và hiển thị riêng trong giao diện.  
  - Người xem có thể click xem chi tiết donation → “từ ai” (nếu public name), “cho ai”, “số tiền”, “thời gian”.

---

### 4.2. Donation Module (Mở rộng)

- Cho phép:
  - **Streamer / tổ chức** đăng ký “Donation link”.  
  - **Người xem** donate bằng token Mezon hoặc Stripe → hiển thị công khai trên Explorer.  
- Explorer có thể hiển thị:
  - Tổng số donation (tổng token / USD).  
  - Top campaign, top donor.  
  - Donation history (minh bạch, giống Etherscan hoặc blockchain charity explorer).  

**Ví dụ URL:**
```
https://explorer.mezon.io/donate/<campaign_id>
https://explorer.mezon.io/address/<wallet>?tab=donations
```

---

### 4.3. Cobar.vn Integration

- **Mục đích:** kết nối sàn thương mại điện tử **Cobar.vn** đã chấp nhận thanh toán bằng MEZ token.  
- **Giao diện:**  
  - Menu “🛍️ Cobar.vn” → hiển thị banner, danh mục sản phẩm nổi bật, link tới `https://cobar.vn`.  
  - Có thể show real-time statistic: “Số đơn hàng thanh toán bằng MEZ hôm nay”.  
- **Tích hợp:**  
  - Sử dụng API `cobar.vn/api/mezon/payments` để hiển thị thống kê.  
  - Dùng cùng token address với hệ thống mainnet (MEZ).

---

### 4.4. Mezon Game Integration

- **Mục đích:** hiển thị các game trong hệ sinh thái Mezon có tích hợp token MEZ.  
- **Nội dung hiển thị:**
  - Danh sách game (icon + mô tả ngắn + link).  
  - Game category: Action, Puzzle, Strategy, Social, Sport.  
  - Hiển thị “Reward pool” bằng MEZ token.  
- **Menu:** “🎮 Mezon Game”  
- **URL:** `/game` hoặc `https://explorer.mezon.io/game`
- **Tích hợp tương lai:** có thể hiển thị “On-chain leaderboard” hoặc “Top players earn MEZ”.

---

### 4.5. Lì Xì / Red Envelope

- Không thay đổi core logic.  
- Khi phát lì xì → hệ thống gắn tag `type=lixi` và public transaction như bình thường.  
- Người xem có thể tra cứu toàn bộ lịch sử lì xì đã diễn ra (minh bạch quà tặng).  

---

## 🧱 5. Navigation Structure (Cập nhật)

Explorer
├── Dashboard
├── Blocks
├── Transactions
├── Accounts
│ ├── Top Accounts
│ └── Account Detail
└── Search

Finance
├── Stake
├── Swap
├── Give Coffee
├── Donate
└── Lì Xì

Community
├── Donation Feed
├── Top Supporters
├── My Activity
└── Notifications

Ecosystem
├── Cobar.vn
├── Mezon Game
└── Developers (Docs)

Settings
├── Profile
├── 2FA Security
├── Privacy Notice
└── Logout


---

## 🎨 6. UI/UX Guidelines

> **🎨 Màu chủ đạo:** `#6941c6` (Mezon Purple)  
> **Tone:** Hiện đại – tin cậy – công nghệ cao – minh bạch.  
> **Phong cách:** Tech Blueprint / Gradient Purple / Neon Highlights.

| Thành phần | Hướng dẫn |
|-------------|------------|
| **Header** | Logo Mezon, nút “Login with Mezon”, dropdown user menu |
| **Sidebar** | Cấu trúc 5 nhóm menu (Explorer, Finance, Community, Ecosystem, Settings) |
| **Main cards** | Số liệu thống kê, có hiệu ứng hover, border glow tím |
| **Tables** | Giao diện giống explorer truyền thống, phân trang, filter |
| **Badges / Tags** | Color code theo loại giao dịch: `donate=purple`, `stake=blue`, `swap=orange`, `lixi=pink` |
| **Privacy Note** | “🔒 Some data is private to logged-in users only.” |
| **Call to action (CTA)** | Nút gradient từ `#6941c6` → `#8b6af0`, bo tròn, shadow nhẹ |
| **Responsive** | Sidebar collapse thành icon khi < 960px |

---

## 📊 7. Data Transparency Policy

| Loại dữ liệu | Public | Private | Ghi chú |
|---------------|---------|----------|---------|
| Balance, Tx History | ✅ | — | Minh bạch on-chain |
| Donation list | ✅ | — | Public cho cộng đồng |
| Lì xì list | ✅ | — | Hiển thị người tạo & người nhận (ẩn tên nếu chọn private) |
| Stake info | ✅ (read-only) | — | Lãi suất, kỳ hạn hiển thị công khai |
| Personal Notification | — | ✅ | Chỉ riêng user |
| 2FA, Settings | — | ✅ | Bảo mật cá nhân |

---

## 🧩 8. Gợi ý UI Layout chính

**Header (Top bar):**
[Logo Mezon Explorer] [Explorer] [Finance] [Community] [Ecosystem] [Settings] [🔐 Login with Mezon]

**Sidebar (nếu dùng layout 2 cột):**
Explorer
Finance
Community
Ecosystem
Settings


**Footer:**
Mezon Explorer © 2025 – Transparency by Design

