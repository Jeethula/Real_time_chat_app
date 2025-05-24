"use client";

import { useState, useRef } from 'react';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { toast } from 'sonner';

interface MessageInputProps {
  chatId: string;
  onMessageSent?: (message: any) => void;
}

export default function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      setSending(true);
      const timestamp = new Date().toISOString();

      // Insert message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
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

      // Optimistically update the UI
      if (onMessageSent) {
        onMessageSent(newMessage);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const timestamp = new Date().toISOString();

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${chatId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      // Insert message with attachment
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
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

      // Optimistically update the UI
      if (onMessageSent) {
        onMessageSent(newMessage);
      }

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
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <FiPaperclip className="h-5 w-5" />
        </Button>

        <Input
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending || uploading}
          className="flex-1"
        />

        <Button
          type="submit"
          size="icon"
          className="flex-shrink-0"
          disabled={!message.trim() || sending || uploading}
        >
          <FiSend className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}