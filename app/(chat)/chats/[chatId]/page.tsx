"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import ChatHeader from '@/components/chat/chat-header';
import MessageList from '@/components/chat/message-list';
import { Chat, ChatParticipant, User } from '@/lib/types';

interface ChatWithParticipants extends Chat {
  chat_participants: (ChatParticipant & { user: User })[];
}

export default function ChatPage() {
  const { chatId } = useParams();
  const [chat, setChat] = useState<ChatWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  
  useEffect(() => {
    const fetchChat = async () => {
      try {
        if (!currentUser || !chatId) return;

        // Fetch chat with participants and their user info
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            chat_participants!inner(
              user_id,
              role,
              user:users(*)
            )
          `)
          .eq('id', chatId)
          .single();
          
        if (chatError) throw chatError;

        // Verify user is a participant
        const isParticipant = chatData.chat_participants.some(
          (p: ChatParticipant & { user: User }) => p.user_id === currentUser.id
        );

        if (!isParticipant) {
          throw new Error('Not a participant');
        }
        
        setChat(chatData);
      } catch (error) {
        console.error('Error fetching chat:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChat();
    
    // Subscribe to chat updates
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`
      }, () => fetchChat())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chat not found</h3>
          <p className="text-muted-foreground">
            The chat you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  const otherParticipants = chat.chat_participants
    .filter((p: ChatParticipant & { user: User }) => p.user_id !== currentUser?.id)
    .map(p => p.user);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} participants={otherParticipants} />
      <MessageList chatId={chatId as string} />
    </div>
  );
}