"use client";

import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiMessageSquare, FiHome, FiBarChart2, FiSettings, FiHelpCircle, FiUser, FiUsers } from 'react-icons/fi';

export function NavSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const navigationItems = [
    { name: 'Home', href: '/home', icon: FiHome },
    { name: 'Chats', href: '/chats', icon: FiMessageSquare },
    { name: 'Analytics', href: '/analytics', icon: FiBarChart2 },
    { name: 'Team', href: '/team', icon: FiUsers },
  ];
  
  const bottomNavigationItems = [
    { name: 'Help', href: '/help', icon: FiHelpCircle },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  return (
    <div className="w-16 bg-white border-r flex flex-col h-full">
      <div className="flex flex-col items-center py-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
          <FiMessageSquare size={20} />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col items-center space-y-4 py-4">
        <TooltipProvider>
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-10 h-10 rounded-full ${
                        isActive ? 'bg-gray-100 text-emerald-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="sr-only">{item.name}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
      
      <div className="flex flex-col items-center space-y-4 py-4">
        <TooltipProvider>
          {bottomNavigationItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <item.icon size={20} />
                    <span className="sr-only">{item.name}</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 hover:ring-2 hover:ring-gray-200"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={user.user_metadata.full_name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={20} className="text-gray-600" />
                )}
                <span className="sr-only">Profile</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}