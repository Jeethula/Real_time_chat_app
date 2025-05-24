-- First, drop existing policies
DROP POLICY IF EXISTS "Allow users to create chats" ON chats;
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Allow adding chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view chat messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
DROP POLICY IF EXISTS "Users can update their chats" ON chats;

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple policy for chats
CREATE POLICY "Enable all access for authenticated users"
ON chats FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Simple policy for chat_participants
CREATE POLICY "Enable all access for authenticated users"
ON chat_participants FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Simple policy for messages
CREATE POLICY "Enable all access for authenticated users"
ON messages FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Add last_message_id column to chats if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'last_message_id'
    ) THEN
        ALTER TABLE chats ADD COLUMN last_message_id UUID REFERENCES messages(id);
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);