"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { ChatSidebar } from '@/components/chat/chat-sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Restore last active chat on mount or after refresh
  useEffect(() => {
    if (!loading && user && pathname === '/chats') {
      const lastOpenChat = localStorage.getItem('lastOpenChat');
      if (lastOpenChat) {
        router.push(`/chats/${lastOpenChat}`);
      }
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Save current chat ID when path changes
  useEffect(() => {
    const chatId = pathname?.split('/').pop();
    if (chatId && pathname?.includes('/chats/')) {
      localStorage.setItem('lastOpenChat', chatId);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}