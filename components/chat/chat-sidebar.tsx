"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatListItem from '@/components/chat/chat-list-item';
import UserList from '@/components/chat/user-list';
import { FiFilter, FiSearch, FiMessageSquare, FiPlus } from 'react-icons/fi';
import { Skeleton } from '@/components/ui/skeleton';
import { Chat, ChatWithDetails, User, Message } from '@/lib/types';

interface ChatParticipant {
  user_id: string;
  username: string;
  avatar_url?: string;
  role?: string;
  joined_at: string;
}

interface ChatDetailsResponse {
  chat_id: string;
  is_group_chat: boolean;
  group_name: string | null;
  created_at: string;
  updated_at: string;
  participants: ChatParticipant[] | string;
  latest_message: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    is_read: boolean;
    user: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  } | null;
  unread_count: number;
}

export function ChatSidebar() {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        if (!currentUser) return;

        // Use the new get_chat_details function
        const { data: chatsData, error } = await supabase
          .rpc('get_chat_details', {
            user_id: currentUser.id
          });

        if (error) {
          console.error('Error fetching chats:', error);
          throw error;
        }

        // Process the returned data
        const processedChats: ChatWithDetails[] = (chatsData as ChatDetailsResponse[]).map(chat => {
          const participants = Array.isArray(chat.participants) 
            ? chat.participants 
            : JSON.parse(chat.participants as string);

          const otherParticipants = participants
            .filter((p: ChatParticipant) => p.user_id !== currentUser.id)
            .map((p: ChatParticipant) => ({
              id: p.user_id,
              username: p.username,
              avatar_url: p.avatar_url
            }));

          const chatName = chat.is_group_chat
            ? chat.group_name || 'Unnamed Group'
            : otherParticipants[0]?.username || 'Unknown User';

          const latestMessage = chat.latest_message 
            ? (typeof chat.latest_message === 'string' 
                ? JSON.parse(chat.latest_message) 
                : chat.latest_message)
            : null;

          return {
            id: chat.chat_id,
            is_group_chat: chat.is_group_chat,
            group_name: chat.group_name || undefined,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            name: chatName,
            latest_message: latestMessage,
            unread_count: chat.unread_count || 0,
            chat_participants: participants.map((p: ChatParticipant) => ({
              user_id: p.user_id,
              role: p.role,
              user: {
                id: p.user_id,
                username: p.username,
                avatar_url: p.avatar_url
              }
            })),
            labels: []
          };
        });

        console.log('Processed chats:', processedChats);
        setChats(processedChats);
        setFilteredChats(processedChats);
      } catch (error) {
        console.error('Error in fetchChats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Set up realtime subscriptions
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats'
      }, () => fetchChats())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => fetchChats())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_participants'
      }, () => fetchChats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  useEffect(() => {
    const filtered = chats.filter(chat => {
      if (!searchTerm) return true;
      
      const nameMatch = chat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const messageMatch = chat.latest_message?.content.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || messageMatch;
    });
    
    setFilteredChats(filtered);
  }, [searchTerm, chats]);

  const activeChatId = pathname ? pathname.split('/').slice(-1)[0] : null;

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full relative">
      {showUserList && (
        <UserList onClose={() => setShowUserList(false)} />
      )}
      
      <div className="px-3 py-2 border-b flex items-center">
        <div className="flex-1 font-medium text-sm text-gray-700 flex items-center">
          <FiMessageSquare className="mr-2 text-gray-500" />
          Chats
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => setShowUserList(true)}
          >
            <FiPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-3 border-b">
        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1 h-7 w-7"
          >
            <FiFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onClick={() => router.push(`/chats/${chat.id}`)}
              />
            ))}
            {filteredChats.length === 0 && !loading && (
              <div className="p-4 text-center text-sm text-gray-500">
                No chats found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}