"use client";

import { useState } from 'react';
import { NavSidebar } from '@/components/navigation/nav-sidebar';
import { ChatSidebar } from '@/components/chat/chat-sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <NavSidebar />
      <ChatSidebar />
      <main className="flex-1 flex flex-col overflow-hidden border-l">
        {children}
      </main>
    </div>
  );
}