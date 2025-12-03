INSERT INTO events (room_id, sender_id, receiver_id, type, content, status, created_at) VALUES
('room1', 'userA', 'userB', 'message', 'Hello userB!', 'pending', NOW()),
('room1', 'userA', 'userB', 'message', 'How are you?', 'pending', NOW()),
('room2', 'userC', 'userB', 'message', 'Hi from userC!', 'pending', NOW()),
('room2', 'userC', 'userB', 'message', 'Another message for userB', 'pending', NOW()),
('room3', 'userD', 'userB', 'message', 'userD says hi!', 'pending', NOW()),
('room3', 'userD', 'userB', 'message', 'userB, check this out!', 'pending', NOW());
