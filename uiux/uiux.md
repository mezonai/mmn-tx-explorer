# 🎨 MEZON MAINNET EXPLORER – UI/UX DESIGN SPECIFICATION (HTML IMPLEMENTATION GUIDE)

**Version:** v2.0  
**Prepared by:** Business Analysis Team  
**Audience:** UI/UX Designer, Frontend Developer  
**Target Output:** HTML prototype & CSS structure for Mezon Explorer redesign (aligned with FRD v2.0)

---

## 🧭 1. Tổng quan

### 🎯 Mục tiêu
Thiết kế bộ giao diện HTML hoàn chỉnh cho **Mezon Mainnet Explorer – Transparency Hub**, nhằm:

1. Giữ **tính minh bạch on-chain** (cho phép tra cứu balance, transaction, donation, stake…).  
2. Tạo **giao diện trực quan, rõ nhóm chức năng**, giúp người dùng dễ dàng điều hướng giữa Explorer / Finance / Community / Ecosystem.  
3. Chuẩn bị sẵn cho **tích hợp Mezon OAuth Login**, **Cobar.vn**, và **Mezon Game**.  
4. Có thể **export trực tiếp sang frontend framework (NextJS, React)** sau này.

---

## 🧱 2. Cấu trúc file HTML cần sinh ra

Mỗi file tương ứng với 1 module lớn trong FRD v2.0.  
Toàn bộ file HTML chia làm 3 nhóm chính:

| Nhóm | Mục đích | File |
|------|-----------|------|
| **Layout & Common** | Khung UI, header, sidebar, footer, color scheme | `index.html`, `style.css`, `theme.css`, `main.js` |
| **Explorer Core** | Trang tra cứu & minh bạch | `dashboard.html`, `blocks.html`, `transactions.html`, `accounts.html`, `account-detail.html`, `search.html` |
| **Finance / Community / Ecosystem** | Các tính năng tài chính & cộng đồng | `stake.html`, `swap.html`, `give-coffee.html`, `donate.html`, `lixi.html`, `community.html`, `cobar.html`, `game.html`, `settings.html` |

---

## 📂 3. Cấu trúc thư mục đề xuất

mezon-explorer/
├── index.html → khung chính (include sidebar + header)
├── /explorer/
│ ├── dashboard.html
│ ├── blocks.html
│ ├── transactions.html
│ ├── accounts.html
│ ├── account-detail.html
│ └── search.html
├── /finance/
│ ├── stake.html
│ ├── swap.html
│ ├── give-coffee.html
│ ├── donate.html
│ └── lixi.html
├── /community/
│ ├── community.html
│ ├── donation-feed.html
│ ├── top-supporters.html
│ ├── my-activity.html
│ └── notifications.html
├── /ecosystem/
│ ├── cobar.html
│ ├── game.html
│ └── developers.html
├── /settings/
│ ├── profile.html
│ ├── privacy.html
│ ├── security.html
│ └── logout.html
├── /assets/
│ ├── logo.svg
│ ├── icons/…
│ ├── img/…
│ └── fonts/
├── style.css → core styling
├── theme.css → màu chủ đạo #6941c6, dark-mode
└── main.js → script điều hướng (SPA hoặc hash router)


---

## 🎨 4. Thiết kế giao diện tổng thể

### Màu chủ đạo
- **Primary:** `#6941c6` (Mezon Purple)  
- **Background:** `#0b1533`  
- **Accent:** `#8b6af0`, `#a98ff8`  
- **Success:** `#20c997`  
- **Warning:** `#f59f00`  
- **Error:** `#ef4444`  
- **Text Light:** `#e6e9f5`  
- **Text Muted:** `#9aa4c8`

---

### Font & Icon
- **Font:** Inter / JetBrains Mono (cho số liệu và hash).  
- **Icons:** Lucide Icons hoặc Phosphor Icons.  
- **Size base:** 16px (desktop), 14px (mobile).  
- **Spacing:** 12–16px grid spacing.

---

### Layout cơ bản (index.html)

```
<header> [Logo Mezon] [Explorer | Finance | Community | Ecosystem | Settings] [🔐 Login with Mezon] </header> <aside class="sidebar"> Explorer - Dashboard - Blocks - Transactions - Accounts - Search Finance - Stake - Swap - Give Coffee - Donate - Lì Xì Community - Donation Feed - Top Supporters - My Activity - Notifications Ecosystem - Cobar.vn - Mezon Game - Developers Settings - Profile - Security - Privacy - Logout </aside> <main class="content"> <!-- dynamic section load --> </main> <footer> Mezon Explorer © 2025 — Transparency by Design </footer> 
```

🧩 5. Mô tả chi tiết từng trang
🧱 5.1. Dashboard (/explorer/dashboard.html)

Mục đích: Thống kê toàn mạng.
Thành phần:

Card grid: Total Blocks, Total Tx, Avg Block Time, Total Wallets, Total Donation Volume.

Chart (Tx/24h).

CTA: “View Blocks”, “View Transactions”.

🧱 5.2. Block List & Detail

Trang: /explorer/blocks.html + modal /explorer/block-detail.html

Danh sách block (paging).

Cột: Block Height | Timestamp | Tx Count | Miner | Hash.

Click → xem chi tiết block: parent hash, list transaction in block.

🧱 5.3. Transaction List & Detail

Trang: /explorer/transactions.html + modal detail.

List giao dịch (paging + filter).

Cột: Tx Hash | From | To | Value | Status | Time.

Filter: success/pending/fail.

Tx type badge: donate, stake, swap, lixi, gift.

🧱 5.4. Accounts & Account Detail

Trang: /explorer/accounts.html, /explorer/account-detail.html

Top Accounts: rank, address, balance, tx count.

Account Detail: balance, tx list, donation history, stake info.

Tab UI:

Overview

Transactions

Donations

Stake

🧱 5.5. Stake (/finance/stake.html)

Stake form: input amount + select term (30d/90d/180d).

List stakes: amount | term | reward | status | action (Claim).

Visual reward meter (progress bar).

🧱 5.6. Swap (/finance/swap.html)

Token swap UI (from/to dropdown, amount input, rate display).

Result preview card.

History table.

🧱 5.7. Give Coffee (/finance/give-coffee.html)

Tab layout:

Send token: input receiver + amount.

Buy gift (Stripe): select package ($50/$100/$200).

History log of sent/received.

🧱 5.8. Donate (/finance/donate.html)

Section 1: Create Donate Link (for Streamer or Organization).

Section 2: Donation Feed (recent donations).

Section 3: Donate modal → input receiver ID + amount + message.

Transparent feed hiển thị realtime: “From – To – Amount – Time”.

🧱 5.9. Lì Xì (/finance/lixi.html)

Form tạo gói lì xì: total, number of receivers, min/max, random toggle, message.

Generate QR Code → hiển thị preview + link share.

Log người nhận (claim list).

Animation mở phong bao 🎁.

🧱 5.10. Cobar.vn Integration (/ecosystem/cobar.html)

Banner: “🛍️ Cobar.vn – Mua sắm bằng Mezon Token”.

Section hiển thị:

Total MEZ payments today.

Product highlight (mock cards).

CTA: “Mua ngay tại cobar.vn”.

External link: https://cobar.vn.

🧱 5.11. Mezon Game (/ecosystem/game.html)

Game list grid:

Game card: icon + title + short description + MEZ reward tag.

Filter by category (Action, Puzzle, Strategy, Social, Sport).

Optional tab “Top players / Reward pool”.

🧱 5.12. Settings (/settings/*.html)

Profile: hiển thị tên, email, ví.

Security: bật 2FA, đổi mật khẩu.

Privacy: chính sách hiển thị dữ liệu công khai.

Logout: thoát OAuth session.

🔧 6. Component Library
Thành phần	Đặc tả
Card	Bo góc 16px, shadow tím nhẹ, hover glow
Button Primary	Gradient #6941c6 → #8b6af0, text trắng, rounded 12px
Button Ghost	Nền trong suốt, border tím mờ
Tag / Badge	Border radius 999px, màu theo type
Modal	Overlay blur, panel bo tròn, dark background
Table	Dòng xen kẽ, border dashed nhẹ
Sidebar	Expand/collapse menu, group label uppercase
Chart placeholder	Dùng <canvas> hoặc SVG line chart
QR code container	Border dashed, center-aligned preview box
📱 7. Responsive Design
Viewport	Layout
≥1200px	Sidebar cố định trái, main content phải
960–1200px	Sidebar có thể collapse
≤960px	Header chuyển sang hamburger menu
≤640px	Card 1 cột, bảng cuộn ngang
🚀 8. Hướng dẫn sinh HTML

Base template: index.html chứa header + sidebar + main content (include bằng JS).

Partial pages: các trang con (dashboard.html, stake.html, …) đặt trong thư mục tương ứng.

CSS:

style.css: grid layout, spacing, typography, component style.

theme.css: color palette (primary #6941c6, background, accents).

JS:

main.js: navigation (hash-based), load page partials bằng fetch().

Mock data load: /data/demo.json cho test trước khi tích hợp backend.

Responsive check: chạy npx live-server hoặc VSCode Live Preview để verify UI.

✅ 9. Kết quả mong đợi

Sau khi sinh bộ HTML:

Giao diện có cấu trúc rõ ràng theo 5 nhóm menu chính.

Có thể click giữa các trang mà không bị “rối” như trước.

Các chức năng minh bạch (Explorer, Donation, Account) vẫn giữ nguyên.

Có chỗ tích hợp cho:

Mezon OAuth Login

Cobar.vn (liên kết thương mại điện tử)

Mezon Game (liên kết gaming)

Dễ dàng chuyển thành NextJS pages trong giai đoạn tiếp theo.

Design color guideline:

🎨 Primary: #6941c6
Gradient accent: #6941c6 → #8b6af0
Background: #0b1533
Font: Inter (UI), JetBrains Mono (code/data)
Style: Modern, Trustworthy, Blockchain Transparency