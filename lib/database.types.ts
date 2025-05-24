export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          last_message_id: string | null
          is_group: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          last_message_id?: string | null
          is_group?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          last_message_id?: string | null
          is_group?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          content: string
          chat_id: string
          user_id: string
          is_read: boolean
          attachment_url: string | null
          attachment_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          chat_id: string
          user_id: string
          is_read?: boolean
          attachment_url?: string | null
          attachment_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          chat_id?: string
          user_id?: string
          is_read?: boolean
          attachment_url?: string | null
          attachment_type?: string | null
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          full_name: string
          avatar_url: string | null
          phone: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
        }
      }
      labels: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      chat_labels: {
        Row: {
          id: string
          chat_id: string
          label_id: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          label_id: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          label_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}