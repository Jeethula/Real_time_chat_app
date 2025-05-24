"use client";

import { useEffect, useState, CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import ChatHeader from '@/components/chat/chat-header';
import MessageList from '@/components/chat/message-list';
import MessageInput from '@/components/chat/message-input';
import { Chat, ChatParticipant, User, MessageWithUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ChatWithParticipants extends Chat {
  chat_participants: (ChatParticipant & { user: User })[];
}

export default function ChatPage() {
  const { chatId } = useParams();
  const [chat, setChat] = useState<ChatWithParticipants | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  
  useEffect(() => {
    const fetchChat = async () => {
      try {
        if (!currentUser || !chatId) return;

        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            chat_participants!inner(
              user_id,
              role,
              user:users(
                id,
                username,
                email,
                avatar_url,
                last_seen
              )
            )
          `)
          .eq('id', chatId)
          .single();
          
        if (chatError) throw chatError;

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
    
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`
      }, () => fetchChat())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, () => {
        // Instead of fetching the whole chat, just update messages
        // This will be handled by MessageList component
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, supabase]);

  const handleNewMessage = (message: MessageWithUser) => {
    setMessages(prev => [...prev, message]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Chat not found</h3>
          <p className="text-sm text-gray-500 mt-1">
            The chat you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  const otherParticipants = chat.chat_participants
    .filter(p => p.user_id !== currentUser?.id)
    .map(p => p.user);

  // Update the return section to ensure the message list gets proper height
  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} participants={otherParticipants} />
      <div className="flex-1 overflow-hidden chat-background relative">
        <div className="absolute inset-0">
          <MessageList 
            chatId={chatId as string} 
            messages={messages}
            onMessagesChange={setMessages}
          />
        </div>
      </div>
      <MessageInput 
        chatId={chatId as string} 
        onMessageSent={handleNewMessage}
      />
    </div>
  );
}