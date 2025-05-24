"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FiX, FiSearch } from 'react-icons/fi';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface UserListProps {
  onClose: () => void;
}

export default function UserList({ onClose }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users, current user:', currentUser?.id);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser?.id);

        if (error) throw error;
        console.log('Found users:', data);
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchUsers();
    }
  }, [currentUser?.id, supabase]);

  const startChat = async (otherUserId: string) => {
    if (creating) return;
    
    try {
      setCreating(true);
      console.log('Starting chat with user:', otherUserId);
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Check for existing chat
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('is_group_chat', false)
        .eq('chat_participants.user_id', otherUserId);

      if (chatError) throw chatError;

      // Check if current user is also a participant in any of these chats
      if (existingChats?.length) {
        const { data: currentUserParticipation } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', currentUser.id)
          .in('chat_id', existingChats.map(c => c.id));

        if (currentUserParticipation?.length) {
          const existingChat = currentUserParticipation[0];
          console.log('Found existing chat:', existingChat.chat_id);
          onClose();
          router.push(`/chats/${existingChat.chat_id}`);
          return;
        }
      }

      // Create new chat
      const timestamp = new Date().toISOString();
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          is_group_chat: false,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { 
            chat_id: newChat.id, 
            user_id: currentUser.id,
            joined_at: timestamp
          },
          { 
            chat_id: newChat.id, 
            user_id: otherUserId,
            joined_at: timestamp
          }
        ]);

      if (participantError) throw participantError;

      // Create initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: newChat.id,
          user_id: currentUser.id,
          content: 'Started a conversation',
          created_at: timestamp,
          is_read: false
        });

      if (messageError) throw messageError;

      console.log('Chat created successfully:', newChat.id);
      onClose();
      router.push(`/chats/${newChat.id}`);

    } catch (error) {
      console.error('Error in startChat:', error);
      toast.error('Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="absolute inset-0 bg-white z-10">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Chat</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <FiX className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto h-[calc(100vh-8rem)]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
          </div>
        ) : creating ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Creating chat...</div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                className="w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left"
                onClick={() => startChat(user.id)}
                disabled={creating}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="font-medium">{user.username}</div>
                  {user.last_seen && (
                    <div className="text-xs text-gray-500">
                      Last seen: {new Date(user.last_seen).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}