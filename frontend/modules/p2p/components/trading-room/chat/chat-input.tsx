'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Image as ImageIcon, Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="p-4 bg-card border-t border-gray-800">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-700 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all"
      >
        <button
          type="button"
          className="text-gray-400 hover:text-white transition"
          aria-label="Add attachment"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="text-gray-400 hover:text-white transition"
          aria-label="Add image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <Input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-white flex-1 text-sm placeholder-gray-600"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="text-brand-primary hover:text-white transition p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};




