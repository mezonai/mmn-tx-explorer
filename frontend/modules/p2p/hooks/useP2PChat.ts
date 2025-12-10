import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';

// Mock data - sẽ thay thế bằng API call sau
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    order_id: '19283746',
    sender_id: 'system',
    sender_type: 'seller',
    content: 'Đơn hàng đã được tạo. 2,545,000 MZD đã được khóa.',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    order_id: '19283746',
    sender_id: 'user1',
    sender_type: 'seller',
    content: 'Chào bạn, mình đang online. Bạn chuyển khoản ghi đúng nội dung MZD 83729 nhé.',
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    order_id: '19283746',
    sender_id: 'buyer1',
    sender_type: 'buyer',
    content: 'Ok bạn, mình đang chuyển đây. Đợi chút nhé.',
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
];

export const useP2PChat = (orderId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMessages(mockMessages.filter((msg) => msg.order_id === orderId));
      setIsLoading(false);
    }, 300);
  }, [orderId]);

  const sendMessage = (content: string, sender_id: string, sender_type: 'buyer' | 'seller') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      order_id: orderId,
      sender_id,
      sender_type,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    // TODO: Call API to send message
  };

  return { messages, isLoading, sendMessage };
};
