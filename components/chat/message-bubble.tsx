import { formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FiCheck } from 'react-icons/fi';
import { User } from '@/lib/types';

interface MessageProps {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_read: boolean;
  user: User;
  attachment_url?: string;
  attachment_type?: string;
}

interface MessageBubbleProps {
  message: MessageProps;
  isCurrentUser: boolean;
}

export default function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage 
          src={message.user.avatar_url || ''} 
          alt={message.user.username} 
        />
        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
          {getInitials(message.user.username)}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.user.username}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
        </div>

        <div className="space-y-1 max-w-md">
          <div 
            className={`
              inline-block rounded-lg px-3 py-2 text-sm
              ${isCurrentUser 
                ? 'bg-emerald-500 text-white rounded-br-none' 
                : 'bg-white text-gray-700 rounded-bl-none shadow-sm'
              }
            `}
          >
            {message.content}
            {message.attachment_url && (
              <div className="mt-2">
                {message.attachment_type?.startsWith('image/') ? (
                  <img 
                    src={message.attachment_url} 
                    alt="Attachment" 
                    className="rounded max-w-xs"
                  />
                ) : (
                  <a 
                    href={message.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                  >
                    View Attachment
                  </a>
                )}
              </div>
            )}
          </div>
          
          {isCurrentUser && (
            <div className="flex justify-end">
              <FiCheck 
                className={`h-3 w-3 ${
                  message.is_read 
                    ? 'text-emerald-500' 
                    : 'text-gray-400'
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}