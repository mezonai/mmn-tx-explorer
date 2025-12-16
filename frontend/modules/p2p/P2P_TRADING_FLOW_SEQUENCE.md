# Sequence Diagram: P2P Trading Flow - Từ "Buy đồng" đến "Hoàn tất"

```mermaid
sequenceDiagram
    participant Buyer as Buyer (Frontend)
    participant Seller as Seller (Frontend)
    participant OffersTable as P2POffersTable
    participant TradingRoom as TradingRoom Component
    participant BuyAmountSection as BuyAmountSection
    participant useCreateOrder as useCreateOrder Hook
    participant P2PService as P2PService API
    participant BackendAPI as Backend API
    participant WebSocket as WebSocket Server
    participant PaymentButton as PaymentActionButton
    participant SellerButton as SellerConfirmButton
    participant ProgressSteps as ProgressSteps Component
    participant useP2POrder as useP2POrder Hook

    Note over Buyer,BackendAPI: Giai đoạn 1: Buyer click "Buy đồng" và tạo Order

    Buyer->>OffersTable: Click button "Buy" trên offer
    OffersTable->>TradingRoom: Navigate to trading room<br/>(offerId, type=offer)
    
    TradingRoom->>BuyAmountSection: Render BuyAmountSection<br/>(offer data)
    BuyAmountSection->>Buyer: Hiển thị form nhập số lượng MZD
    
    Buyer->>BuyAmountSection: Nhập số lượng MZD<br/>(amountMZD, amountVND)
    Buyer->>BuyAmountSection: Click "Xác nhận mua"
    
    BuyAmountSection->>TradingRoom: handleConfirmBuy(amountMZD, amountVND)
    TradingRoom->>useCreateOrder: createOrder(offer, amountMZD, amountVND)
    
    useCreateOrder->>P2PService: createOrder({offer_id, amount, price})
    P2PService->>BackendAPI: POST /api/v1/offers/{offerId}/orders<br/>{offer_id, amount, price}
    
    BackendAPI->>BackendAPI: Tạo Order với status='OPEN'<br/>Tạo transfer_code<br/>Set expires_at (+15 phút)
    
    BackendAPI->>P2PService: Response: P2POrder<br/>{order_id, status='OPEN', ...}
    P2PService->>useCreateOrder: Return order
    useCreateOrder->>TradingRoom: Return newOrder
    
    TradingRoom->>TradingRoom: setCreatedOrder(newOrder)
    
    BackendAPI->>WebSocket: Broadcast CREATE_ORDER event<br/>(to Seller)
    WebSocket->>Seller: CREATE_ORDER event<br/>(order data)
    Seller->>Seller: useP2POrders hook<br/>Thêm order vào danh sách
    
    Note over Buyer,BackendAPI: Giai đoạn 2: Order Status = OPEN (Thanh toán)
    
    TradingRoom->>ProgressSteps: Render ProgressSteps<br/>(order.status='OPEN')
    ProgressSteps->>Buyer: Hiển thị Step 1: "Thanh toán" (active)
    
    TradingRoom->>BuyAmountSection: Ẩn BuyAmountSection
    TradingRoom->>TradingRoom: Render OrderInfoCard, BankInfoCard,<br/>PaymentActionButton
    
    PaymentButton->>Buyer: Hiển thị button<br/>"Đã chuyển tiền, thông báo cho người bán"
    
    Note over Buyer,BackendAPI: Giai đoạn 3: Buyer xác nhận đã chuyển tiền
    
    Buyer->>PaymentButton: Click "Đã chuyển tiền..."
    PaymentButton->>TradingRoom: handlePaymentConfirmed()
    
    TradingRoom->>useP2POrder: updateOrderStatus('PENDING')
    useP2POrder->>useP2POrder: Optimistic update<br/>(status='PENDING')
    
    useP2POrder->>P2PService: updateOrderStatus(orderId, 'PENDING')
    P2PService->>BackendAPI: POST /api/v1/orders/{orderId}/confirm<br/>{status: 'PENDING'}
    
    BackendAPI->>BackendAPI: Cập nhật order status='PENDING'
    
    BackendAPI->>P2PService: Response: Updated P2POrder<br/>{status='PENDING', ...}
    P2PService->>useP2POrder: Return updated order
    useP2POrder->>TradingRoom: Update order state
    
    TradingRoom->>ProgressSteps: Re-render với order.status='PENDING'
    ProgressSteps->>Buyer: Hiển thị Step 2: "Chờ xác nhận" (active)
    
    BackendAPI->>WebSocket: Broadcast ORDER_STATUS_UPDATED<br/>(status='PENDING')
    WebSocket->>Seller: ORDER_STATUS_UPDATED event<br/>(order_id, status='PENDING')
    Seller->>Seller: useP2POrders hook<br/>Cập nhật order trong danh sách
    
    Seller->>TradingRoom: Navigate to trading room<br/>(orderId)
    TradingRoom->>useP2POrder: Fetch order by ID
    useP2POrder->>P2PService: getOrderById(orderId)
    P2PService->>BackendAPI: GET /api/v1/orders/{orderId}
    BackendAPI->>P2PService: Return order (status='PENDING')
    P2PService->>useP2POrder: Return order
    useP2POrder->>TradingRoom: Set order state
    
    TradingRoom->>ProgressSteps: Render ProgressSteps<br/>(order.status='PENDING')
    ProgressSteps->>Seller: Hiển thị Step 2: "Chờ xác nhận" (active)
    
    TradingRoom->>SellerButton: Render SellerConfirmButton<br/>(order.status='PENDING')
    SellerButton->>Seller: Hiển thị button<br/>"Xác nhận đã nhận được tiền, chuyển MZD"
    
    Note over Buyer,BackendAPI: Giai đoạn 4: Seller xác nhận đã nhận tiền
    
    Seller->>SellerButton: Click "Xác nhận đã nhận được tiền..."
    SellerButton->>TradingRoom: handleSellerConfirm()
    
    TradingRoom->>useP2POrder: updateOrderStatus('CONFIRMED')
    useP2POrder->>useP2POrder: Optimistic update<br/>(status='CONFIRMED')
    
    useP2POrder->>P2PService: updateOrderStatus(orderId, 'CONFIRMED')
    P2PService->>BackendAPI: POST /api/v1/orders/{orderId}/confirm<br/>{status: 'CONFIRMED'}
    
    BackendAPI->>BackendAPI: Cập nhật order status='CONFIRMED'<br/>Chuyển MZD từ Seller sang Buyer
    
    BackendAPI->>P2PService: Response: Updated P2POrder<br/>{status='CONFIRMED', ...}
    P2PService->>useP2POrder: Return updated order
    useP2POrder->>TradingRoom: Update order state
    
    TradingRoom->>ProgressSteps: Re-render với order.status='CONFIRMED'
    ProgressSteps->>Seller: Hiển thị Step 3: "Hoàn tất" (active)
    
    BackendAPI->>WebSocket: Broadcast ORDER_STATUS_UPDATED<br/>(status='CONFIRMED')
    WebSocket->>Buyer: ORDER_STATUS_UPDATED event<br/>(order_id, status='CONFIRMED')
    Buyer->>Buyer: useP2POrder hook<br/>Cập nhật order state
    
    TradingRoom->>ProgressSteps: Re-render với order.status='CONFIRMED'
    ProgressSteps->>Buyer: Hiển thị Step 3: "Hoàn tất" (active)
    
    Note over Buyer,Seller: Cả Buyer và Seller đều thấy "Hoàn tất"
```

## Mô tả các giai đoạn:

### Giai đoạn 1: Tạo Order (Status: OPEN)
- Buyer click "Buy" trên bảng offers
- Buyer nhập số lượng MZD muốn mua
- Buyer click "Xác nhận mua"
- Hệ thống tạo Order với status='OPEN'
- Seller nhận thông báo qua WebSocket về order mới

### Giai đoạn 2: Thanh toán (Status: OPEN)
- ProgressSteps hiển thị Step 1: "Thanh toán" (active)
- Buyer thấy thông tin ngân hàng và transfer_code
- Buyer thực hiện chuyển khoản ngoài hệ thống

### Giai đoạn 3: Chờ xác nhận (Status: PENDING)
- Buyer click "Đã chuyển tiền, thông báo cho người bán"
- Order status chuyển sang 'PENDING'
- ProgressSteps hiển thị Step 2: "Chờ xác nhận" (active)
- Seller nhận thông báo và vào trading room

### Giai đoạn 4: Hoàn tất (Status: CONFIRMED)
- Seller click "Xác nhận đã nhận được tiền, chuyển MZD"
- Order status chuyển sang 'CONFIRMED'
- Backend chuyển MZD từ Seller sang Buyer
- ProgressSteps hiển thị Step 3: "Hoàn tất" (active)
- Cả Buyer và Seller đều thấy trạng thái "Hoàn tất"

