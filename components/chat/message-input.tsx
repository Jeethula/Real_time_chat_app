"use client";

import { useState, useRef } from 'react';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Clock,
  Star,
  ChevronDown 
} from 'lucide-react';
import { toast } from 'sonner';
import { Message, MessageWithUser } from '@/lib/types';

interface MessageInputProps {
  chatId: string;
  onMessageSent?: (message: MessageWithUser) => void;
}

export default function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      setSending(true);
      const timestamp = new Date().toISOString();

      // Create optimistic message
      const optimisticMessage: MessageWithUser = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        user_id: currentUser.id,
        content: message.trim(),
        created_at: timestamp,
        is_read: false,
        user: currentUser
      };

      // Update UI optimistically
      if (onMessageSent) {
        onMessageSent(optimisticMessage);
      }

      // Clear input
      setMessage('');

      // Send actual message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: currentUser.id,
          content: message.trim(),
          created_at: timestamp,
          is_read: false
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (messageError) throw messageError;

      // Update chat timestamp
      await supabase.rpc('update_chat_timestamp', {
        p_chat_id: chatId
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore message if failed
      setMessage(message);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setUploading(true);
      const timestamp = new Date().toISOString();

      // Create optimistic message for file
      const optimisticMessage: MessageWithUser = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        user_id: currentUser.id,
        content: `Uploading ${file.name}...`,
        created_at: timestamp,
        is_read: false,
        user: currentUser
      };

      // Update UI optimistically
      if (onMessageSent) {
        onMessageSent(optimisticMessage);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${chatId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: currentUser.id,
          content: file.name,
          attachment_url: publicUrl,
          attachment_type: file.type,
          created_at: timestamp,
          is_read: false
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (messageError) throw messageError;

      // Update chat timestamp
      await supabase.rpc('update_chat_timestamp', {
        p_chat_id: chatId
      });

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="outline" size="sm" className="text-xs h-7 rounded-full">
          WhatsApp
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7 rounded-full">
          Private Note
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 bg-green-500 text-white">
          <AvatarImage src={currentUser?.avatar_url} />
          <AvatarFallback>
            {currentUser?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
          <Input
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 placeholder:text-gray-400"
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending || uploading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <div className="flex items-center gap-2 text-gray-400">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Clock className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Star className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-lg">⚡</span>
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          size="icon" 
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={!message.trim() || sending}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">Periskope</div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  );
}