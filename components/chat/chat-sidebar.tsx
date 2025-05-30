"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversationItem } from '@/components/chat/conversation-item';
import UserList from '@/components/chat/user-list';
import { toast } from 'sonner';
import { 
  Filter, 
  Search, 
  RefreshCw, 
  HelpCircle,
  MessageCircle,
  Home,
  Inbox,
  LineChart,
  List,
  Volume2,
  Users,
  Columns,
  Settings,
  Plus,
  MessageSquarePlus,
  LogOut
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChatWithDetails, ChatDetailsResponse } from '@/lib/types';

interface NavButtonProps {
  icon: React.ElementType;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}

const NavButton = ({ icon: Icon, active, count, onClick, className }: NavButtonProps) => (
  <button 
    className={`text-gray-500 hover:text-green-500 relative ${active ? 'text-green-500' : ''} ${className || ''}`}
    onClick={onClick}
  >
    <Icon className="w-6 h-6" />
    {count && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-[8px] flex items-center justify-center">
        {count}
      </span>
    )}
  </button>
);

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
  const activeChatId = pathname ? pathname.split('/').slice(-1)[0] : null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      if (!currentUser) return;

      setLoading(true);
      const { data: chatsData, error } = await supabase
        .rpc('get_chat_details', {
          user_id: currentUser.id
        });

      if (error) throw error;

      const processedChats: ChatWithDetails[] = (chatsData as ChatDetailsResponse[]).map(chat => {
        const participants = Array.isArray(chat.participants) 
          ? chat.participants 
          : JSON.parse(chat.participants as string);

        const otherParticipants = participants
          .filter((p: { user_id: string; username: string; avatar_url?: string }) => 
            p.user_id !== currentUser.id
          );

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
          chat_participants: participants.map((p: any) => ({
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

      setChats(processedChats);
      setFilteredChats(processedChats);
    } catch (error) {
      console.error('Error in fetchChats:', error);
      toast.error('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    fetchChats();

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
  }, [fetchChats, supabase]);

  useEffect(() => {
    const filtered = chats.filter(chat => {
      if (!searchTerm) return true;
      
      const nameMatch = chat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const messageMatch = chat.latest_message?.content.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || messageMatch;
    });
    setFilteredChats(filtered);
  }, [searchTerm, chats]);

  return (
    <>
      {/* Left sidebar */}
      <div className="w-16 bg-white border-r flex flex-col items-center py-4">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
          <span className="text-xs">P</span>
        </div>
        <nav className="flex flex-col gap-6 items-center mt-6">
          <NavButton icon={MessageCircle} />
          <NavButton icon={Home} />
          <NavButton icon={Inbox} active />
          <NavButton icon={LineChart} />
          <NavButton icon={List} />
          <NavButton icon={Volume2} />
          <NavButton icon={Users} count={1} />
          <NavButton icon={Columns} />
          <NavButton icon={Settings} />
        </nav>
        {/* Add logout button at bottom */}
        <div className="mt-auto">
          <NavButton 
            icon={LogOut} 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="w-80 border-r overflow-y-auto relative">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <span className="text-gray-500 text-sm">chats</span>
            <RefreshCw 
              className="w-4 h-4 text-gray-500 ml-auto cursor-pointer" 
              onClick={() => fetchChats()} 
            />
            <HelpCircle className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Filter className="w-4 h-4" /> Custom filter
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <div className="flex items-center gap-1 text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Filtered</span>
                <Badge className="bg-green-500 text-white h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                  {filteredChats.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto pb-16">
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
                <ConversationItem
                  key={chat.id}
                  avatar={chat.chat_participants[0]?.user?.username?.[0] || 'U'}
                  avatarColor="bg-green-500"
                  title={chat.name}
                  message={chat.latest_message?.content}
                  phone={chat.chat_participants[0]?.user?.email}
                  time={new Date(chat.updated_at).toLocaleDateString()}
                  type="Demo"
                  label={chat.labels?.[0]}
                  labelColor="bg-green-100 text-green-600"
                  unread={chat.unread_count > 0}
                  active={chat.id === activeChatId}
                  onClick={() => router.push(`/chats/${chat.id}`)}
                  user={chat.chat_participants[0]?.user}
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

        {/* New chat button - match WhatsApp style */}
        <button
          onClick={() => setShowUserList(true)}
          className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquarePlus className="w-6 h-6" />
        </button>
      </div>

      {showUserList && (
        <UserList onClose={() => setShowUserList(false)} />
      )}
    </>
  );
}