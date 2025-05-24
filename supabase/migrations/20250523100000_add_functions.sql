-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true
  WHERE chat_id = p_chat_id
  AND user_id != p_user_id
  AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update chat timestamp
CREATE OR REPLACE FUNCTION update_chat_timestamp(p_chat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chats
  SET updated_at = NOW()
  WHERE id = p_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_chat_timestamp(UUID) TO authenticated;

-- Add policy for executing functions
CREATE POLICY "Allow users to execute functions for their chats"
ON messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
);