import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
  }
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const createClient = () => createClientComponentClient<Database>();