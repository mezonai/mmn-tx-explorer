# Phase 1 Testing Guide

## Cách Test Phase 1: Core Infrastructure

### Method 1: Sử dụng WebSocketTest Component (Recommended)

1. **Thêm WebSocketTest component vào P2P page tạm thời:**

```tsx
// modules/p2p/components/p2p.tsx
import { WebSocketTest } from './websocket-test';

export const P2P = () => {
  // ... existing code ...
  
  return (
    <div className="w-full space-y-6">
      {/* Add test component temporarily */}
      <WebSocketTest />
      
      <P2PHeader />
      {/* ... rest of components ... */}
    </div>
  );
};
```

2. **Truy cập `/p2p` và test:**
   - Login vào app
   - Navigate đến `/p2p`
   - Xem WebSocketTest component
   - Click các test buttons
   - Verify events được nhận

### Method 2: Test qua Browser Console

1. **Mở browser console (F12)**

2. **Check WebSocket connection:**
```javascript
// Access WebSocketManager through window (temporary)
// First, you need to expose it in development mode
```

3. **Test emit event từ console:**
```javascript
// This requires exposing manager to window in dev mode
// Or use React DevTools to access component state
```

### Method 3: Test qua React DevTools

1. Install React DevTools extension
2. Open DevTools → React tab
3. Find `WebSocketProvider` component
4. Check `isConnected` state
5. Check `user` from `AppProvider`

## Test Scenarios

### ✅ Test 1: Connection khi Login

**Steps:**
1. Logout (nếu đang login)
2. Check console: Should see no WebSocket logs
3. Login
4. Check console: Should see `[MockWebSocket] Connected`
5. Check WebSocketTest component: Connection Status = "Connected"

**Expected Result:**
- ✅ Console log: `[MockWebSocket] Connected`
- ✅ Component shows: `Connection Status: Connected`
- ✅ User ID displayed correctly

### ✅ Test 2: Disconnection khi Logout

**Steps:**
1. Login (ensure connected)
2. Logout
3. Check console: Should see `[MockWebSocket] Disconnected`
4. Check WebSocketTest component: Connection Status = "Disconnected"

**Expected Result:**
- ✅ Console log: `[MockWebSocket] Disconnected`
- ✅ Component shows: `Connection Status: Disconnected`
- ✅ User ID = "Not logged in"

### ✅ Test 3: Subscribe và Receive Events

**Steps:**
1. Login
2. Navigate to `/p2p` (with WebSocketTest component)
3. Check "Subscribed Channel" shows: `user:{yourUserId}:orders`
4. Click "Test emitOrderStatusUpdate" button
5. Check "Received Events" section

**Expected Result:**
- ✅ Event appears in "Received Events" list
- ✅ Event has correct structure:
  ```json
  {
    "type": "p2p:order:status_update",
    "payload": {
      "orderId": "test_order_123",
      "status": "WAIT_CONFIRM",
      "updatedBy": "{yourUserId}",
      "order": {...}
    },
    "timestamp": "2024-..."
  }
  ```
- ✅ Console log: `[WebSocketTest] Received event: {...}`

### ✅ Test 4: Multiple Events

**Steps:**
1. Login
2. Click "Test emitOrderStatusUpdate" multiple times
3. Click "Test Direct Emit" multiple times

**Expected Result:**
- ✅ All events appear in "Received Events" (max 10)
- ✅ Events are in reverse chronological order (newest first)
- ✅ Each event has unique timestamp

### ✅ Test 5: Cleanup khi Unmount

**Steps:**
1. Login
2. Navigate to `/p2p` (subscribe happens)
3. Navigate away from `/p2p`
4. Check console: Should see no errors

**Expected Result:**
- ✅ No memory leaks
- ✅ No console errors
- ✅ Unsubscribe called correctly

## Debugging Tips

### Check Console Logs

Look for these logs:
- `[MockWebSocket] Connected` - When user logs in
- `[MockWebSocket] Disconnected` - When user logs out
- `[WebSocketTest] Received event:` - When event is received
- `[MockWebSocket] Cannot emit: not connected` - If trying to emit when disconnected

### Common Issues

1. **"Connection Status: Disconnected" even after login**
   - Check: Is `user?.id` available in AppProvider?
   - Check: Is WebSocketProvider wrapped correctly in AppProvider?

2. **Events not received**
   - Check: Is channel name correct? Should be `user:{userId}:orders`
   - Check: Is subscribe called after connection?
   - Check: Console for errors

3. **TypeScript errors**
   - Run: `yarn lint` or `npm run lint`
   - Fix any type errors

## Next Steps

Sau khi test xong Phase 1:
- ✅ Remove WebSocketTest component (hoặc comment out)
- ✅ Proceed to Phase 2: Orders List implementation

