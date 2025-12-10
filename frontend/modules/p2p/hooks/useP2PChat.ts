import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';

// Mock data - sẽ thay thế bằng API call sau
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    orderId: '19283746',
    senderId: 'system',
    senderType: 'system',
    content: 'Đơn hàng đã được tạo. 2,545,000 MZD đã được khóa.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '2',
    orderId: '19283746',
    senderId: 'user1',
    senderType: 'seller',
    content: 'Chào bạn, mình đang online. Bạn chuyển khoản ghi đúng nội dung MZD 83729 nhé.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    orderId: '19283746',
    senderId: 'buyer1',
    senderType: 'buyer',
    content: 'Ok bạn, mình đang chuyển đây. Đợi chút nhé.',
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

export const useP2PChat = (orderId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMessages(mockMessages.filter((msg) => msg.orderId === orderId));
      setIsLoading(false);
    }, 300);
  }, [orderId]);

  const sendMessage = (content: string, senderId: string, senderType: 'buyer' | 'seller') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      orderId,
      senderId,
      senderType,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMessage]);
    // TODO: Call API to send message
  };

  return { messages, isLoading, sendMessage };
};
