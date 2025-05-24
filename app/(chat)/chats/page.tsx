"use client";

import { FiMessageSquare } from 'react-icons/fi';

export default function ChatsPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-primary/10 rounded-full">
          <FiMessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-medium">Your Messages</h2>
        <p className="text-sm text-muted-foreground">
          Select a chat from the sidebar or start a new conversation
        </p>
      </div>
    </div>
  );
}