CREATE OR REPLACE FUNCTION verify_chat_participants()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_participants' 
        AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE chat_participants 
        ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_participants_user_id_fkey'
    ) THEN
        ALTER TABLE chat_participants 
        ADD CONSTRAINT chat_participants_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_participants_chat_id_fkey'
    ) THEN
        ALTER TABLE chat_participants 
        ADD CONSTRAINT chat_participants_chat_id_fkey 
        FOREIGN KEY (chat_id) 
        REFERENCES chats(id) 
        ON DELETE CASCADE;
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT verify_chat_participants();

UPDATE chat_participants 
SET joined_at = NOW() 
WHERE joined_at IS NULL;

ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;
CREATE POLICY "Users can view their chat participants"
ON chat_participants FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    chat_id IN (
        SELECT chat_id 
        FROM chat_participants 
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert chat participants" ON chat_participants;
CREATE POLICY "Users can insert chat participants"
ON chat_participants FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 
        FROM chat_participants 
        WHERE chat_id = NEW.chat_id 
        AND user_id = auth.uid()
    )
);

GRANT ALL ON chat_participants TO authenticated;

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);