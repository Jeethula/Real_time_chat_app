"use client";

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Star, 
  ChevronLeft,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { Chat, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ChatHeaderProps {
  chat: Chat;
  participants: User[];
}

export default function ChatHeader({ chat, participants }: ChatHeaderProps) {
  const router = useRouter();
  
  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Offline';
    return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = chat.is_group_chat 
    ? (chat.group_name || 'Unnamed Group') 
    : (participants[0]?.username || 'Unknown User');

  const lastSeen = chat.is_group_chat 
    ? `${participants.length} participants`
    : formatLastSeen(participants[0]?.last_seen);

  return (
    <div className="border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 lg:hidden text-gray-500"
            onClick={() => router.push('/chats')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            {chat.is_group_chat ? (
              <div className="relative">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((participant) => (
                    <Avatar key={participant.id} className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {getInitials(participant.username)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {participants.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-white text-sm">
                      +{participants.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participants[0]?.avatar_url} />
                  <AvatarFallback>
                    {getInitials(participants[0]?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                {participants[0]?.last_seen && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
            )}
            
            <div>
              <h2 className="font-medium text-gray-900">{displayName}</h2>
              <p className="text-xs text-gray-500">{lastSeen}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Star className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}