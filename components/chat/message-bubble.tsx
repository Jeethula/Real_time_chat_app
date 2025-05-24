import { format } from 'date-fns';
import { MessageWithUser } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-provider';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageWithUser;
  showUserInfo?: boolean;
}

export default function MessageBubble({ message, showUserInfo }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isCurrentUser = message.user_id === currentUser?.id;

  const renderContent = () => {
    if (message.attachment_url) {
      if (message.attachment_type?.startsWith('image/')) {
        return (
          <div className="relative">
            <img 
              src={message.attachment_url} 
              alt={message.content}
              className="max-w-[300px] rounded-lg"
            />
            <p className="mt-1 text-sm">{message.content}</p>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <svg 
            className="w-8 h-8 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <a 
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {message.content}
          </a>
        </div>
      );
    }
    return message.content;
  };

  return (
    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
      {showUserInfo && !isCurrentUser && (
        <span className="text-green-600 text-sm font-medium ml-12 mb-0.5">
          {message.user?.username}
        </span>
      )}
      <div className="flex items-end gap-2">
        {!isCurrentUser && message.user?.avatar_url && (
          <img 
            src={message.user.avatar_url} 
            alt={message.user.username}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div 
          className={`
            relative px-3 py-2 rounded-lg max-w-md
            ${isCurrentUser ? 'bg-[#e7ffdb]' : 'bg-white'}
          `}
        >
          <div className="text-[0.9375rem] leading-[1.4]">
            {renderContent()}
          </div>
          <div className="flex items-center gap-1 absolute bottom-1 right-2 translate-y-full -mt-1">
            <span className="text-[0.6875rem] text-gray-500">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {isCurrentUser && (
              <div className="text-gray-500">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}