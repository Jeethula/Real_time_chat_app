import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Volume2 } from "lucide-react"
import { User } from "@/lib/types"

interface ConversationItemProps {
  avatar?: string | React.ReactNode
  avatarColor?: string
  title: string
  message?: string
  phone?: string
  time?: string
  type?: string
  label?: string
  labelColor?: string
  badge?: string
  unread?: boolean
  active?: boolean
  muted?: boolean
  onClick?: () => void
  user?: User
}

export function ConversationItem({
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
}: ConversationItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={`p-3 hover:bg-gray-50 cursor-pointer ${active ? "bg-gray-50" : ""}`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url || ''} alt={title} />
            <AvatarFallback className={`${avatarColor} text-white`}>
              {typeof avatar === 'string' ? avatar : getInitials(title)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium truncate">{title}</div>
            <div className="text-xs text-gray-500">{type}</div>
          </div>
          <div className="text-sm text-gray-500 truncate">{message}</div>
          {phone && (
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <span>{phone}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <div className="text-xs text-gray-500">{time}</div>
          <div className="flex items-center gap-1">
            {label && (
              <Badge
                variant="outline" 
                className={`text-xs px-1.5 py-0.5 rounded ${labelColor || ""}`}
              >
                {label}
              </Badge>
            )}
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
            {unread && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            {muted && (
              <span className="text-gray-400">
                <Volume2 className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}