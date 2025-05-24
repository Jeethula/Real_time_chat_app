"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message, User, MessageWithUser } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';

interface MessageListProps {
  chatId: string;
  messages: MessageWithUser[];
  onMessagesChange: Dispatch<SetStateAction<MessageWithUser[]>>;
}

interface MessageGroups {
  [key: string]: MessageWithUser[];
}

export default function MessageList({ chatId, messages, onMessagesChange }: MessageListProps) {
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users
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

  // Fetch messages
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
        
        const processedMessages: MessageWithUser[] = (messagesData || []).map(msg => ({
          ...msg,
          user: users.get(msg.user_id) || msg.user as User
        }));

        onMessagesChange(processedMessages);
        
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
  }, [chatId, currentUser, supabase, users, onMessagesChange]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat_messages:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, async (payload) => {
        // Get user data for the message
        const messageUser = users.get(payload.new.user_id) || await fetchUser(payload.new.user_id);
        
        const newMessage: MessageWithUser = {
          ...payload.new as Message,
          user: messageUser
        };

        onMessagesChange(prev => [...prev, newMessage]);

        if (currentUser && newMessage.user_id !== currentUser.id) {
          await supabase.rpc('mark_messages_as_read', {
            p_chat_id: chatId,
            p_user_id: currentUser.id
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, supabase, users, onMessagesChange]);

  // Fetch user data if not in cache
  const fetchUser = async (userId: string): Promise<User> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (data) {
      setUsers(prev => new Map(prev).set(data.id, data));
      return data;
    }
    return {
      id: userId,
      username: 'Unknown User',
      avatar_url: undefined
    };
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: MessageGroups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="space-y-6">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="text-center text-xs text-gray-500">
              {date}
            </div>
            {dateMessages.map((message: MessageWithUser, i: number) => {
              const isCurrentUser = message.user_id === currentUser?.id;
              const showUserInfo = !isCurrentUser && 
                (!dateMessages[i - 1] || dateMessages[i - 1].user_id !== message.user_id);

              return (
                <div key={message.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  {showUserInfo && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-green-600 text-sm">{message.user?.username}</span>
                      <span className="text-xs text-gray-500">{message.user?.email}</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg shadow-sm max-w-xs ${
                    isCurrentUser ? 'bg-green-100' : 'bg-white'
                  }`}>
                    <p>{message.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {isCurrentUser && message.user?.email && (
                      <span className="text-xs text-gray-400">{message.user.email}</span>
                    )}
                    <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isCurrentUser && (
                      <span className="text-green-500">✓✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}