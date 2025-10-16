## 1. Overview

### Mục tiêu
Mezon Mainnet Explorer (Private Version) hướng đến:
- Duy trì tính minh bạch tổng thể (thống kê hệ thống).  
- Bảo vệ quyền riêng tư người dùng (ẩn dữ liệu ví & lịch sử giao dịch).  
- Tích hợp thêm các tính năng tài chính – cộng đồng mới:
  - Give Coffee
  - Stake
  - Swap
  - Donate cho Streamer
  - Lì xì (Red Envelope)

---

## 2. User Roles

| Role | Quyền | Mô tả |
|------|--------|--------|
| **Guest** | Public access | Chỉ xem thống kê tổng quan hệ thống |
| **Authenticated User** | Private access | Xem dữ liệu cá nhân, thực hiện các giao dịch |
| **Admin** | Internal access | Quản lý, giám sát log, staking pool (v2) |

---

## 3. Core Modules

### 3.1. Authentication

**Mục đích:** Xác thực người dùng để truy cập dữ liệu cá nhân.  

**Flow:**
1. User mở trang Explorer.  
2. Nếu chưa đăng nhập → redirect đến trang **Login**.  
3. User đăng nhập qua Mezon Account hoặc ZK-Login.  
4. Nhận JWT token → truy cập My Dashboard.  

**UI/UX:**  
- Trang `/login` hoặc modal.  
- Success → redirect `/dashboard`.  
- States: Logged out / Logging in / Invalid credentials / Session expired.

---

### 3.2. Public Dashboard

**Mục đích:** Hiển thị thống kê tổng quan toàn mạng (public).  

**Data hiển thị:**
- Total blocks  
- Total transactions  
- Average block time  
- Total wallets  
- Total “Give Coffee” gifts  

**UI/UX:**  
- 5 card thống kê.  
- CTA: “Login to view your personal dashboard”.

---

### 3.3. My Dashboard

**Mục đích:** Trang tổng hợp dữ liệu cá nhân.  

**Data hiển thị:**
- My balance  
- My total transactions (24h / pending / total)  
- My staking overview  
- My coffee summary (sent / received)  
- My donate & red-envelope history  

**UI Layout:**
- **Top section:** statistic cards (balance, tx, stake, coffee).  
- **Bottom section:** line chart / transaction timeline.  

**Actions:**  
- Quick buttons: `Give Coffee`, `Stake`, `Swap`, `Donate`, `Send Lì xì`.

---

### 3.4. Account Detail

**Mục đích:** Xem thông tin ví cá nhân.  

**Data hiển thị:**
- Address  
- Balance  
- Tx count  
- Last update block  
- Transaction history (with filters)  

**Filter & Limitations:**
- Require time range input (default 3 months, max 12 months).  
- Filter type: All / Sent / Received.  
- Pagination: 20 records/page.  

**Security:**  
- Chỉ xem được ví của chính mình (`session.wallet == address`).

---

### 3.5. Give Coffee

**Type A – Send Mezon Token:**
- User login → chọn người nhận → nhập số lượng → confirm transaction → broadcast on-chain.  
- Record fields: sender, receiver, amount, tx_hash, timestamp.  
- States: `Pending → Success → Failed`.

**Type B – Buy Gift via Stripe:**
- User login → chọn gói (50$, 100$, 200$) → thanh toán qua Stripe → backend chuyển token cho người nhận.  
- Record fields: payer_id, receiver, usd_value, token_amount, stripe_id, status.  
- States: `Created → Paid → TokenIssued → Completed`.

**UI:**  
- Page `/give-coffee` với 2 tab: [Send Token] / [Buy Gift].  
- Popup confirmation + success message.  

**Notification:**  
> “☕ You’ve received a coffee from Alice!”

---

### 3.6. Stake

**Mục đích:** Cho phép user gửi token để nhận lãi.  

**Data model:**
| Field | Description |
|--------|-------------|
| stake_amount | Số lượng token stake |
| start_date / end_date | Thời gian stake |
| interest_rate | % reward |
| reward_claimable | Có thể claim chưa |
| status | Active / Completed / Claimed |

**Actions:**
- `Stake Now`
- `View My Stakes`
- `Claim Reward`

**Flow:**
1. User chọn “Stake Now”.  
2. Nhập số lượng token → xác nhận → broadcast transaction.  
3. Khi đủ kỳ hạn → hệ thống thông báo “Reward available”.  
4. User “Claim Reward”.

**UI/UX:**  
- Tab layout: [My Stakes] [Stake Now] [Claim Reward].

---

### 3.7. Swap

**Mục đích:** Hoán đổi token nội bộ trong hệ sinh thái Mezon.  

**Token pair:**
- MEZ ↔ CoffeeToken  
- MEZ ↔ USD (internal value)

**Flow:**
1. Login → chọn token pair.  
2. Nhập số lượng.  
3. Confirm → backend xử lý swap.  
4. Show result (new balances).  

**Validation:**
- Kiểm tra balance đủ.  
- Lấy tỷ giá từ config.  

**UI/UX:**  
- Giao diện kiểu DEX nhỏ gọn.  
- Input + output token card.  

---

### 3.8. Search (Limited Scope)

**Mục đích:** Tìm kiếm transaction của chính mình.  

**Input:** Transaction hash.  
**Validation:** Server chỉ trả về nếu `sender` hoặc `receiver` == `session.wallet`.  
**UI:** Search bar → result card.  
**Empty state:** “No transaction found under your account.”

---

### 3.9. Settings

**Mục đích:** Quản lý bảo mật tài khoản & privacy.  

**Functions:**
- Change password  
- Enable 2FA  
- Logout all sessions  
- Privacy Notice  

**Privacy text:**  
> “Your wallet balance and transactions are visible only to you. Mezon does not store your private key.”

**UI:**  
- Page `/settings`  
- Section: `Account Security`, `Privacy Policy`

---

## 4. New Features (Community Layer)

---

### 4.1. Donate cho Streamer

**Mục đích:** Cho phép người dùng **donate token trực tiếp cho streamer**, tương tự “Super Chat” của YouTube.  

**Flow tổng quan:**
1. Streamer đăng ký tài khoản Mezon để tạo **Donate Link**:  
   `https://explorer.mezon.io/donate/<streamer_id>`
2. Người xem click link → mở trang donate hiển thị thông tin streamer.  
3. Nhập số lượng token → confirm donate → broadcast transaction.  
4. Streamer nhận thông báo: “🎉 New donation from [user]!”.

**Integration concept:**
- Streamer có thể nhúng link trong YouTube, Twitch hoặc overlay livestream.  
- Có thể embed widget hiển thị **Donate Mezon** trực tiếp trên video.

**Data model:**
| Field | Description |
|--------|-------------|
| donor_id | ID người tặng |
| streamer_id | ID người nhận |
| amount | Số token |
| message | Optional lời nhắn |
| tx_hash | Transaction hash |
| timestamp | Thời gian |

**UI/UX:**
- Popup nhỏ: `Streamer Info | Amount | Confirm`.  
- Hiển thị recent donations (optional).  

**Optional v2:**
- Leaderboard top donor.  
- Badge “Top Supporter” trong Mezon chat.

---

### 4.2. Lì Xì (Red Envelope Feature)

**Mục đích:** Cho phép user phát lì xì token qua QR code kèm lời chúc.  

**Flow chi tiết:**
1. User login → chọn “Tạo lì xì mới”.  
2. Nhập:  
   - Tổng số tiền (token)  
   - Số người nhận  
   - Số tiền min/max (optional)  
   - Lời chúc (“Chúc bạn may mắn 🎉”)  
3. Xác nhận → hệ thống tạo **Lì xì session**.  
4. Hệ thống sinh **QR code** → user copy/share link.  
5. Người khác scan QR → nếu còn phần thưởng → nhận token + lời chúc.  

**Validation Rules:**
- QR code hết hạn sau X ngày.  
- Khi hết lượt nhận → hiển thị “🎁 Đã hết lì xì”.  
- Có thể bật Random mode để chia ngẫu nhiên.  

**Data model:**
| Field | Description |
|--------|-------------|
| red_packet_id | ID gói lì xì |
| creator_id | Người tạo |
| total_amount | Tổng tiền |
| participant_count | Số người dự kiến |
| amount_min / max | Giới hạn |
| is_random | Boolean |
| message | Lời chúc |
| remaining_amount | Số tiền còn lại |
| qr_code | Link QR |
| created_at / expired_at | Thời gian |

**UI/UX:**
- Page `/red-envelope` với 2 tab: [Tạo Lì Xì] / [Danh sách của tôi].  
- Khi người nhận scan → show:  
  - Lời chúc  
  - Số tiền nhận được  
  - Animation mở phong bao lì xì 🎊  

**Optional v2:**
- Event lì xì dịp Tết, sinh nhật, lễ hội.  
- “Top người lì xì nhiều nhất 🎊”.

---

## 5. Security & Privacy Rules

| Rule | Mô tả |
|------|--------|
| R1 | Chỉ user login mới xem được dữ liệu cá nhân. |
| R2 | Mọi request private API đều cần JWT token. |
| R3 | Transaction query chỉ trả về data của chính user. |
| R4 | Limit query time range ≤ 12 tháng. |
| R5 | Rate limit API 20 req/min/user. |
| R6 | QR Code lì xì chỉ chứa tokenized session id, không chứa wallet trực tiếp. |
| R7 | Donate link mã hoá, không hiển thị ví streamer công khai. |

---

## 6. UI/UX Guidelines  

> **Note cho UI/UX:**  
> Màu chủ đạo của hệ thống: **#6941c6** (Mezon Purple).  
> Tone hiện đại, trẻ trung, công nghệ cao, thể hiện cảm giác tin cậy & riêng tư.  

| Thành phần | Mô tả |
|-------------|--------|
| **Style** | Mezon Blue/Purple theme (#6941c6, #0B1533), accent neon. |
| **Font** | Inter / JetBrains Mono. |
| **Layout** | Card-based, responsive 1366px+. |
| **Icons** | Lucide hoặc Phosphor icons. |
| **Tone UX** | Privacy-first, Friendly, Tech-trust. |
| **Feedbacks** | Toast + animation (coffee pour, envelope open, etc). |
| **Empty states** | Dễ hiểu, có minh hoạ nhỏ. |
| **CTA buttons** | Màu tím chính (#6941c6) – gradient nhẹ. |
| **Hover/Focus** | Nhấn mạnh bằng bóng mờ tím và hiệu ứng blur. |

---

## 7. Navigation Structure

```
Public Area
 ├── Dashboard (public overview)
 ├── Login
Private Area
 ├── My Dashboard
 ├── Account Detail
 ├── Give Coffee
 ├── Stake
 ├── Swap
 ├── Donate
 ├── Lì Xì
 ├── Search (mine only)
 ├── Settings
 └── Logout

```


---

## 8. Summary Table

| Module | Visibility | Purpose | Status |
|---------|-------------|----------|---------|
| Dashboard | Public + Private | Statistic tổng + cá nhân | ✅ |
| Account Detail | Private | Xem ví của mình | ✅ |
| Give Coffee | Private | Gift token / Stripe payment | ✅ |
| Stake | Private | Gửi token nhận lãi | ✅ |
| Swap | Private | Hoán đổi token nội bộ | ✅ |
| Search | Private | Chỉ tìm tx của bản thân | ✅ |
| Donate | Private / Embedded | Donate cho streamer | ✅ |
| Lì Xì | Private | Phát lì xì qua QR code | ✅ |
| Settings | Private | Bảo mật, privacy | ✅ |
