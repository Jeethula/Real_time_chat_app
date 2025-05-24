"use client";

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Star, ChevronLeft } from 'lucide-react';
import { Chat, User } from '@/lib/types';

interface ChatHeaderProps {
  chat: Chat;
  participants: User[];
}

export default function ChatHeader({ chat, participants }: ChatHeaderProps) {
  const router = useRouter();
  
  const formatParticipants = (participants: User[]) => {
    if (!participants.length) return 'No participants';
    
    if (participants.length === 1) {
      return participants[0].username;
    }
    
    if (participants.length === 2) {
      return participants.map(p => p.username).join(', ');
    }
    
    return `${participants[0].username}, ${participants[1].username} +${participants.length - 2} more`;
  };

  const displayName = chat.is_group_chat 
    ? (chat.group_name || 'Unnamed Group') 
    : (participants[0]?.username || 'Unknown User');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="border-b p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 lg:hidden mr-2 text-gray-500"
            onClick={() => router.push('/chats')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <h2 className="font-medium">{displayName}</h2>
            <div className="text-xs text-gray-500">
              {formatParticipants(participants)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stacked avatars */}
          <div className="flex -space-x-2">
            {participants.slice(0, 4).map((participant, i) => (
              <Avatar key={participant.id} className="w-6 h-6 border-2 border-white">
                <AvatarImage src={participant.avatar_url} alt={participant.username} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  {getInitials(participant.username)}
                </AvatarFallback>
              </Avatar>
            ))}
            {participants.length > 4 && (
              <Avatar className="w-6 h-6 border-2 border-white bg-green-500 text-white flex items-center justify-center text-xs">
                <span>+{participants.length - 4}</span>
              </Avatar>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500"
          >
            <Star className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}