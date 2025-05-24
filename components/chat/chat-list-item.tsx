import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FiCheck } from 'react-icons/fi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatWithDetails, User } from '@/lib/types';

interface ChatListItemProps {
  chat: ChatWithDetails;
  isActive: boolean;
  onClick: () => void;
}

const labelColors: Record<string, string> = {
  Demo: 'bg-gray-100 text-gray-700',
  Internal: 'bg-emerald-100 text-emerald-700',
  Signup: 'bg-blue-100 text-blue-700',
  Content: 'bg-orange-100 text-orange-700',
  "Don't Send": 'bg-red-100 text-red-700',
};

export default function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = chat.name || chat.group_name || 'Unnamed Chat';

  // Get other participant's avatar for direct chats
  const otherParticipant = !chat.is_group_chat ? 
    chat.chat_participants.find(p => p.user)?.user : undefined;

  const avatarUrl = chat.is_group_chat 
    ? undefined 
    : otherParticipant?.avatar_url;

  const lastMessage = chat.latest_message
    ? chat.latest_message.attachment_url
      ? `[${chat.latest_message.content}]`
      : chat.latest_message.content
    : 'No messages yet';

  return (
    <div 
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${isActive ? 'bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center mb-1">
        <div className="flex-1 font-medium text-sm truncate">{displayName}</div>
        {chat.latest_message && (
          <div className="text-xs text-gray-500">
            {formatDate(chat.latest_message.created_at)}
          </div>
        )}
      </div>
      
      <div className="flex items-start">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={avatarUrl || ''} alt={displayName} />
          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            {chat.labels?.map((label, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={`mr-1 px-1.5 py-0 text-[10px] rounded ${labelColors[label] || 'bg-gray-100 text-gray-700'}`}
              >
                {label}
              </Badge>
            ))}
            
            {chat.unread_count > 0 && (
              <div className="ml-auto flex-shrink-0">
                <div className="bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {chat.unread_count}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 truncate flex items-center">
            {chat.latest_message?.is_read && chat.latest_message?.user_id === otherParticipant?.id && (
              <FiCheck className="inline mr-1 text-emerald-500" size={12} />
            )}
            <span className="truncate">{lastMessage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}