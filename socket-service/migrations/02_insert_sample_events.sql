INSERT INTO events (id, type, payload, sender_id, receive_id, status, create_at) VALUES
	(gen_random_uuid(), 'chat', '{"message": "Hello, world!", "room": "room1"}', 'userA', 'userB', 'pending', now()),
	(gen_random_uuid(), 'trade', '{"tradeType": "SELL", "amount": 1000, "price": 0.8}', 'userB', 'userA', 'pending', now()),
	(gen_random_uuid(), 'notification', '{"title": "Welcome", "body": "Chào mừng bạn đến với hệ thống!"}', 'system', 'userA', 'sent', now()),
	(gen_random_uuid(), 'chat', '{"message": "Bạn đã nhận được tiền!", "room": "room2"}', 'userC', 'userA', 'pending', now()),
	(gen_random_uuid(), 'trade', '{"tradeType": "BUY", "amount": 500, "price": 0.85}', 'userA', 'userC', 'pending', now());

