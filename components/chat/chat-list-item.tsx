import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Volume2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/lib/types";

interface ChatListItemProps {
  avatar?: string | React.ReactNode;
  avatarColor?: string;
  title: string;
  message?: string;
  phone?: string;
  time?: string;
  type?: string;
  label?: string;
  labelColor?: string;
  badge?: string;
  unread?: boolean;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
  user?: User;
}

export default function ChatListItem({
  avatar,
  avatarColor = "bg-gray-200",
  title,
  message,
  phone,
  time,
  type,
  label,
  labelColor,
  badge,
  unread,
  active,
  muted,
  onClick,
  user
}: ChatListItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedTime = time ? formatDistanceToNow(new Date(time), { addSuffix: true }) : '';

  return (
    <div
      className={`
        px-4 py-3 cursor-pointer transition-colors
        ${active ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"}
      `}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className={`${avatarColor} text-white`}>
              {typeof avatar === 'string' ? avatar : getInitials(title)}
            </AvatarFallback>
          </Avatar>
          {user?.last_seen && new Date(user.last_seen).getTime() > Date.now() - 5 * 60 * 1000 && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium truncate text-[15px] text-[#111b21]">
              {title}
            </div>
            <div className={`text-xs whitespace-nowrap ml-2 ${unread ? 'text-green-600 font-medium' : 'text-[#667781]'}`}>
              {formattedTime}
            </div>
          </div>

          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1 text-[13px] text-[#667781] truncate">
              {message && (
                <span className="flex items-center gap-0.5">
                  <Check className="w-4 h-4" />
                  {message}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              {label && (
                <Badge
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 border-0 ${labelColor || "bg-gray-100 text-gray-600"}`}
                >
                  {label}
                </Badge>
              )}
              {badge && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 border-0 bg-gray-100 text-gray-600">
                  {badge}
                </Badge>
              )}
              {unread && (
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[11px] flex items-center justify-center font-medium">
                  1
                </span>
              )}
              {muted && (
                <span className="text-[#8696a0]">
                  <Volume2 className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>

          {phone && (
            <div className="text-xs text-[#8696a0] truncate mt-0.5">
              {phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}