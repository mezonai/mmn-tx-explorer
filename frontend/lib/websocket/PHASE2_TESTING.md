# Phase 2 Testing Guide

## Mục đích Test Phase 2

Phase 2 test **Orders List với Real-time Updates** để verify:

1. ✅ **Orders List hiển thị đúng** - Seller có thể xem danh sách orders của mình
2. ✅ **Real-time Updates hoạt động** - Khi Buyer click "Đã chuyển tiền", Seller's orders list tự động update
3. ✅ **UI Updates ngay lập tức** - Không cần refresh page, status và buttons tự động thay đổi
4. ✅ **WebSocket Integration** - Verify WebSocket events được nhận và xử lý đúng

## Test Scenarios

### Test 1: Orders List Display ✅

**Mục đích:** Verify orders list hiển thị đúng với mock data

**Steps:**
1. Login với bất kỳ user nào
2. Navigate đến `/p2p`
3. Click tab **"My Orders"**

**Expected Results:**
- ✅ Hiển thị 2 mock orders:
  - Order `19283746`: Status `PAYMENT_PENDING` (màu vàng)
  - Order `19283747`: Status `WAIT_CONFIRM` (màu cam, có "Open to confirm" button)
- ✅ Orders có `sellerId` = user.id hiện tại
- ✅ Orders có `sellerUsername` = username hiện tại
- ✅ Status badges hiển thị đúng màu
- ✅ Time remaining countdown hoạt động

---

### Test 2: Real-time Status Update ✅

**Mục đích:** Verify orders list tự động update khi có WebSocket event

**Steps:**
1. Login và navigate đến `/p2p` → Tab "My Orders"
2. Xem Order `19283746` có status `PAYMENT_PENDING`
3. Mở browser console (F12)
4. Chạy test command:

```javascript
// Get your user ID from the page (check console logs or component)
const userId = '1987523042833600512'; // Replace with your actual user ID

// Test: Emit order status update event
window.__wsManager.emitOrderStatusUpdate(
  '19283746',  // Order ID
  'WAIT_CONFIRM',  // New status
  'buyer1',  // updatedBy
  {
    id: '19283746',
    status: 'WAIT_CONFIRM',
    offerId: '1',
    buyerId: 'buyer1',
    sellerId: userId,
    sellerUsername: 'Your Username',
    amountMZD: 2545000,
    amountVND: 2545000,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    transferCode: 'MZD 83729',
    bankInfo: {
      bank: 'TCB',
      accountNumber: '19034482991022',
      accountName: 'NGUYEN VAN A',
    },
  },
  userId  // sellerId (your current user.id)
);
```

**Expected Results:**
- ✅ Order `19283746` tự động update status từ `PAYMENT_PENDING` → `WAIT_CONFIRM`
- ✅ Status badge thay đổi màu (vàng → cam)
- ✅ "Open to confirm" button xuất hiện
- ✅ Row được highlight với màu cam
- ✅ Console log: `[useP2POrders] Received order status update: { orderId, status }`
- ✅ **KHÔNG cần refresh page** - Update ngay lập tức

---

### Test 3: Multiple Updates ✅

**Mục đích:** Verify system handle multiple updates correctly

**Steps:**
1. Login và navigate đến `/p2p` → Tab "My Orders"
2. Chạy test command nhiều lần với different order IDs:

```javascript
const userId = '1987523042833600512'; // Your user ID

// Update order 19283746
window.__wsManager.emitOrderStatusUpdate('19283746', 'WAIT_CONFIRM', 'buyer1', undefined, userId);

// Update order 19283747
window.__wsManager.emitOrderStatusUpdate('19283747', 'PAYMENT_CONFIRMED', 'buyer2', undefined, userId);
```

**Expected Results:**
- ✅ Mỗi order update đúng
- ✅ Không có conflicts
- ✅ UI updates smooth

---

### Test 4: Navigation ✅

**Mục đích:** Verify navigation từ orders list đến trading room

**Steps:**
1. Login và navigate đến `/p2p` → Tab "My Orders"
2. Click vào order row hoặc "Open to confirm" button

**Expected Results:**
- ✅ Navigate đến `/p2p/trading/{orderId}`
- ✅ Trading room hiển thị đúng order

---

## Quick Test Commands

### Command 1: Update Order to WAIT_CONFIRM
```javascript
window.__wsManager.emitOrderStatusUpdate(
  '19283746',
  'WAIT_CONFIRM',
  'buyer1',
  undefined,
  '1987523042833600512' // Your user ID
);
```

### Command 2: Update Order to PAYMENT_CONFIRMED
```javascript
window.__wsManager.emitOrderStatusUpdate(
  '19283747',
  'PAYMENT_CONFIRMED',
  'buyer2',
  undefined,
  '1987523042833600512' // Your user ID
);
```

### Command 3: Check Connection Status
```javascript
console.log('Connected:', window.__wsManager.isConnected());
console.log('User ID:', window.__wsManager.getUserId());
```

---

## Success Criteria

Phase 2 được coi là **PASSED** nếu:

- ✅ Orders list hiển thị đúng với mock data
- ✅ Real-time updates hoạt động (không cần refresh)
- ✅ Status badges và buttons update đúng
- ✅ WebSocket events được nhận và xử lý
- ✅ Navigation hoạt động
- ✅ Không có console errors

---

## Troubleshooting

### Issue: Orders không hiển thị
**Solution:** 
- Check user.id có đúng không
- Check console logs
- Verify mock data được generate với đúng sellerId

### Issue: Real-time update không hoạt động
**Solution:**
- Check WebSocket connection: `window.__wsManager.isConnected()`
- Check user ID trong command có đúng không
- Check console logs: `[useP2POrders] Received order status update`
- Verify channel name: `user:{userId}:orders`

### Issue: `window.__wsManager` is undefined
**Solution:**
- Check bạn đang ở development mode
- Refresh page và check console logs
- Verify WebSocketProvider đã mount

---

## Next Steps

Sau khi Phase 2 test PASSED:
- ✅ Proceed to Phase 3: Trading Room Updates
- ✅ Implement PaymentActionButton emit event
- ✅ Test end-to-end flow: Buyer → Seller

