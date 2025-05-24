"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import MessageBubble from '@/components/chat/message-bubble';
import { Message, User, LoadingUser, convertSupabaseUser } from '@/lib/types';
import MessageInput from './message-input';

interface MessageWithUser extends Message {
  user: User;
}

interface MessageListProps {
  chatId: string;
}

export default function MessageList({ chatId }: MessageListProps) {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users data separately to ensure we have complete user info
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: usersData } = await supabase
        .from('users')
        .select('*');

      if (usersData) {
        const usersMap = new Map(usersData.map(u => [u.id, u]));
        setUsers(usersMap);
      }
    };

    fetchUsers();
  }, [supabase]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            user:users(*)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        
        // Ensure each message has user data
        const processedMessages: MessageWithUser[] = (messagesData || []).map(msg => ({
          ...msg,
          user: users.get(msg.user_id) || msg.user as User
        }));

        setMessages(processedMessages);
        
        if (currentUser) {
          await supabase.rpc('mark_messages_as_read', {
            p_chat_id: chatId,
            p_user_id: currentUser.id
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (users.size > 0) {
      fetchMessages();
    }
  }, [chatId, currentUser, supabase, users]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        const defaultUser: LoadingUser = {
          id: newMessage.user_id,
          username: users.get(newMessage.user_id)?.username || 'Loading...',
          avatar_url: users.get(newMessage.user_id)?.avatar_url
        };

        const messageWithUser: MessageWithUser = {
          ...newMessage,
          user: users.get(newMessage.user_id) || defaultUser
        };

        setMessages(prev => [...prev, messageWithUser]);

        // Mark message as read if from other user
        if (currentUser && messageWithUser.user_id !== currentUser.id) {
          supabase.rpc('mark_messages_as_read', {
            p_chat_id: chatId,
            p_user_id: currentUser.id
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, supabase, users]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageSent = (newMessage: Message) => {
    if (!currentUser) return;

    // Add user data to the message
    const messageWithUser: MessageWithUser = {
      ...newMessage,
      user: users.get(currentUser.id) || {
        ...convertSupabaseUser(currentUser),
        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User'
      }
    };
    setMessages(prev => [...prev, messageWithUser]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.user_id === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput chatId={chatId} onMessageSent={handleMessageSent} />
    </>
  );
}