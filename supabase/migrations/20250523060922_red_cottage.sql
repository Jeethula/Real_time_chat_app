/*
  # Initial database schema

  1. New Tables
    - `users` - Stores user information
    - `chats` - Stores chat information
    - `messages` - Stores messages for each chat
    - `chat_participants` - Maps users to chats
    - `labels` - Stores label information
    - `chat_labels` - Maps labels to chats

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_group BOOLEAN DEFAULT FALSE NOT NULL,
  last_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Update foreign key reference in chats table
ALTER TABLE chats 
  ADD CONSTRAINT fk_last_message 
  FOREIGN KEY (last_message_id) 
  REFERENCES messages(id) 
  ON DELETE SET NULL;

-- Create chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(chat_id, user_id)
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create chat labels table
CREATE TABLE IF NOT EXISTS chat_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(chat_id, label_id)
);

-- Create user triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_labels ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles of chat participants"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT cp.user_id 
      FROM chat_participants cp
      WHERE cp.chat_id IN (
        SELECT chat_id 
        FROM chat_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Chats table policies
CREATE POLICY "Users can view their chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages table policies
CREATE POLICY "Users can view messages in their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    ) AND
    user_id = auth.uid()
  );

-- Chat participants table policies
CREATE POLICY "Users can view participants in their chats"
  ON chat_participants
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to their chats"
  ON chat_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Labels table policies
CREATE POLICY "Everyone can view labels"
  ON labels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create labels"
  ON labels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Chat labels table policies
CREATE POLICY "Users can view labels for their chats"
  ON chat_labels
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add labels to their chats"
  ON chat_labels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT chat_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to create a direct chat between two users
CREATE OR REPLACE FUNCTION create_direct_chat(
  user1_id UUID,
  user2_id UUID,
  chat_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Create a new chat
  INSERT INTO chats (name, is_group)
  VALUES (chat_name, FALSE)
  RETURNING id INTO new_chat_id;
  
  -- Add both users as participants
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (new_chat_id, user1_id),
    (new_chat_id, user2_id);
  
  RETURN new_chat_id;
END;
$$;

-- Create function to create a group chat
CREATE OR REPLACE FUNCTION create_group_chat(
  creator_id UUID,
  group_name TEXT,
  member_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id UUID;
  member_id UUID;
BEGIN
  -- Create a new chat
  INSERT INTO chats (name, is_group)
  VALUES (group_name, TRUE)
  RETURNING id INTO new_chat_id;
  
  -- Add creator as participant
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES (new_chat_id, creator_id);
  
  -- Add other members as participants
  FOREACH member_id IN ARRAY member_ids
  LOOP
    IF member_id <> creator_id THEN
      INSERT INTO chat_participants (chat_id, user_id)
      VALUES (new_chat_id, member_id);
    END IF;
  END LOOP;
  
  RETURN new_chat_id;
END;
$$;