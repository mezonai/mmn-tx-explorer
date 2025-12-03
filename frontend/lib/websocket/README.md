# Mock WebSocket - Phase 1 Implementation

## Files Created

1. **types.ts** - TypeScript type definitions
2. **mock-websocket.ts** - Core Mock WebSocket engine (EventEmitter pattern)
3. **websocket-manager.ts** - Singleton manager for WebSocket operations
4. **WebSocketProvider.tsx** - React Context Provider

## Testing Connection/Disconnection

### Manual Test in Browser Console

```javascript
// 1. Check if WebSocket is connected
// Open browser console and run:
window.__wsManager = require('@/lib/websocket/websocket-manager').default.getInstance();
console.log('Connected:', window.__wsManager.isConnected());
console.log('User ID:', window.__wsManager.getUserId());

// 2. Test emit event
window.__wsManager.emit('p2p:order:status_update', {
  orderId: 'test_order_123',
  status: 'WAIT_CONFIRM',
  updatedBy: 'buyer1'
}, 'user:seller1:orders');

// 3. Test subscribe
const callback = (event) => {
  console.log('Received event:', event);
};
window.__wsManager.subscribe('user:seller1:orders', callback);

// 4. Test emit again (should trigger callback)
window.__wsManager.emit('p2p:order:status_update', {
  orderId: 'test_order_123',
  status: 'WAIT_CONFIRM',
  updatedBy: 'buyer1'
}, 'user:seller1:orders');
```

### Test via React Component

Create a test component to verify:

```tsx
'use client';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useEffect } from 'react';

export function WebSocketTest() {
  const { isConnected, subscribe, emitOrderStatusUpdate } = useWebSocket();

  useEffect(() => {
    const callback = (event: any) => {
      console.log('[WebSocketTest] Received event:', event);
    };

    subscribe('user:test:orders', callback);

    return () => {
      // Cleanup handled by unsubscribe
    };
  }, [subscribe]);

  const handleTest = () => {
    emitOrderStatusUpdate(
      'test_order_123',
      'WAIT_CONFIRM',
      'buyer1',
      { id: 'test_order_123', status: 'WAIT_CONFIRM' },
      'seller1'
    );
  };

  return (
    <div>
      <p>WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>
      <button onClick={handleTest}>Test Emit Event</button>
    </div>
  );
}
```

## Integration Status

✅ **Phase 1 Complete:**
- [x] types.ts created
- [x] mock-websocket.ts created
- [x] websocket-manager.ts created
- [x] WebSocketProvider.tsx created
- [x] AppProvider.tsx updated to wrap WebSocketProvider
- [x] No linter errors

## Next Steps (Phase 2)

- Create hooks/useP2POrders.ts
- Create components/p2p-orders-list.tsx
- Create components/order-row.tsx
- Update components/p2p.tsx with tabs

