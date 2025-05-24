-- Enable storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'chat-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('chat-attachments', 'chat-attachments');
  END IF;
END $$;


CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read attachments from their chats"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1
    FROM chat_participants
    WHERE chat_participants.chat_id::text = (storage.foldername(name))[1]
    AND chat_participants.user_id = auth.uid()
  )
);

-- Grant usage on bucket
GRANT ALL ON STORAGE TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;