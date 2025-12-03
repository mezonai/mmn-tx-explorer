'use client';

import { useWebSocket } from '@/providers/WebSocketProvider';
import { useUser } from '@/providers/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { WebSocketEvent } from '@/lib/websocket/types';

/**
 * WebSocket Test Component
 * 
 * Component này dùng để test Phase 1: Core Infrastructure
 * 
 * Cách sử dụng:
 * 1. Import và thêm vào P2P page tạm thời
 * 2. Hoặc truy cập trực tiếp qua route riêng
 * 
 * Test scenarios:
 * - Connection status khi login/logout
 * - Subscribe/Unsubscribe events
 * - Emit events và nhận callbacks
 */
export function WebSocketTest() {
  const { user } = useUser();
  const {
    isConnected,
    subscribe,
    unsubscribe,
    emitOrderStatusUpdate,
    emit,
  } = useWebSocket();

  const [receivedEvents, setReceivedEvents] = useState<WebSocketEvent[]>([]);
  const [subscribedChannel, setSubscribedChannel] = useState<string | null>(null);

  // Subscribe to test channel
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const channel = `user:${user.id}:orders`;
    setSubscribedChannel(channel);

    const callback = (event: WebSocketEvent) => {
      console.log('[WebSocketTest] Received event:', event);
      setReceivedEvents((prev) => [event, ...prev].slice(0, 10)); // Keep last 10 events
    };

    subscribe(channel, callback);

    return () => {
      unsubscribe(channel, callback);
    };
  }, [isConnected, user?.id, subscribe, unsubscribe]);

  const handleTestEmit = () => {
    if (!user?.id) {
      alert('Please login first');
      return;
    }

    // Test emitOrderStatusUpdate
    emitOrderStatusUpdate(
      'test_order_123',
      'WAIT_CONFIRM',
      user.id,
      {
        id: 'test_order_123',
        status: 'WAIT_CONFIRM',
        buyerId: user.id,
        sellerId: 'seller_test_123',
      },
      user.id // Emit to own channel for testing
    );
  };

  const handleTestDirectEmit = () => {
    if (!user?.id) {
      alert('Please login first');
      return;
    }

    // Test direct emit
    emit(
      'p2p:order:status_update',
      {
        orderId: 'test_order_456',
        status: 'PAYMENT_CONFIRMED',
        updatedBy: user.id,
        order: {
          id: 'test_order_456',
          status: 'PAYMENT_CONFIRMED',
        },
      },
      `user:${user.id}:orders`
    );
  };

  const clearEvents = () => {
    setReceivedEvents([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>WebSocket Test - Phase 1</CardTitle>
        <CardDescription>
          Test WebSocket connection, subscription, and event emission
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Connection Status:</span>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <span className="font-medium">User ID:</span>
          <Badge variant="outline">{user?.id || 'Not logged in'}</Badge>
        </div>

        {/* Subscribed Channel */}
        {subscribedChannel && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Subscribed Channel:</span>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded">{subscribedChannel}</code>
          </div>
        )}

        {/* Test Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleTestEmit} disabled={!isConnected || !user?.id}>
            Test emitOrderStatusUpdate
          </Button>
          <Button onClick={handleTestDirectEmit} disabled={!isConnected || !user?.id} variant="outline">
            Test Direct Emit
          </Button>
          <Button onClick={clearEvents} variant="ghost" size="sm">
            Clear Events
          </Button>
        </div>

        {/* Received Events */}
        <div>
          <h3 className="font-medium mb-2">
            Received Events ({receivedEvents.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {receivedEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No events received yet. Click test buttons above.</p>
            ) : (
              receivedEvents.map((event, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-900 rounded border border-gray-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-gray-500 text-xs">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'No timestamp'}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded text-sm">
          <p className="font-medium mb-2">Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Make sure you are logged in (check User ID above)</li>
            <li>Check Connection Status should be "Connected"</li>
            <li>Click "Test emitOrderStatusUpdate" button</li>
            <li>Check console logs for "[MockWebSocket] Connected" and event logs</li>
            <li>Verify event appears in "Received Events" section</li>
            <li>Try logout and check Connection Status changes to "Disconnected"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

