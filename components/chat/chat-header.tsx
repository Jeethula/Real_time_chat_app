import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FiSearch, FiStar, FiMoreHorizontal, FiChevronLeft } from 'react-icons/fi';
import { Chat, User } from '@/lib/types';

interface ChatHeaderProps {
  chat: Chat;
  participants: User[];
}

export default function ChatHeader({ chat, participants }: ChatHeaderProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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

  const avatarUrl = chat.is_group_chat
    ? undefined
    : participants[0]?.avatar_url;

  return (
    <div className="border-b px-4 py-2.5 flex items-center justify-between bg-white">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 lg:hidden mr-2 text-gray-500"
          onClick={() => router.push('/chats')}
        >
          <FiChevronLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src={avatarUrl || ''} alt={displayName} />
          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="font-medium">
            {displayName}
          </div>
          {participants.length > 0 && (
            <div className="text-xs text-gray-500 truncate max-w-[300px]">
              {formatParticipants(participants)}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <FiSearch className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
        >
          <FiStar className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
        >
          <FiMoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}