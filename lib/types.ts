import { User as SupabaseUser } from '@supabase/supabase-js';

export interface PublicUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_seen?: string;
}

export interface User extends PublicUser {
  email?: string;
  aud?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  chat_id: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_type?: string;
  parent_message_id?: string;
  user?: User;
}

export interface ChatParticipant {
  user_id: string;
  chat_id: string;
  role?: string;
  joined_at: string;
  user?: User;
}

export interface ChatParticipantBasic {
  user_id: string;
  role?: string;
  user?: User;
}

export interface Chat {
  id: string;
  name?: string;
  group_name?: string;
  is_group_chat: boolean;
  created_at: string;
  updated_at: string;
  last_message_id?: string;
  chat_participants: ChatParticipant[];
}

export interface ChatWithDetails extends Omit<Chat, 'chat_participants'> {
  chat_participants: ChatParticipantBasic[];
  messages?: Message[];
  latest_message?: Message | null;
  unread_count: number;
  name: string;
  labels?: string[];
}

export interface LoadingUser extends PublicUser {
  id: string;
  username: string;
  avatar_url?: string;
}

export const convertSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
  email: user.email,
  avatar_url: user.user_metadata?.avatar_url,
  created_at: user.created_at,
  aud: user.aud,
});