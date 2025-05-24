CREATE OR REPLACE VIEW chat_details AS
SELECT 
    c.id AS chat_id,
    c.is_group_chat,
    c.group_name,
    c.created_at,
    c.updated_at,
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'user_id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'role', cp.role,
            'joined_at', cp.joined_at
        )
    ) AS participants,
    (
        SELECT JSONB_BUILD_OBJECT(
            'id', m.id,
            'content', m.content,
            'created_at', m.created_at,
            'user_id', m.user_id,
            'is_read', m.is_read,
            'user', JSONB_BUILD_OBJECT(
                'id', u2.id,
                'username', u2.username,
                'avatar_url', u2.avatar_url
            )
        )
        FROM messages m
        LEFT JOIN users u2 ON m.user_id = u2.id
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS latest_message,
    (
        SELECT COUNT(*)::integer
        FROM messages m2
        WHERE m2.chat_id = c.id
        AND m2.is_read = false
    ) AS unread_count
FROM chats c
JOIN chat_participants cp ON c.id = cp.chat_id
JOIN users u ON cp.user_id = u.id
GROUP BY c.id;

GRANT SELECT ON chat_details TO authenticated;

CREATE OR REPLACE FUNCTION get_chat_details(user_id UUID)
RETURNS TABLE (
    chat_id UUID,
    is_group_chat BOOLEAN,
    group_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    participants JSONB,
    latest_message JSONB,
    unread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.chat_id,
        cd.is_group_chat,
        cd.group_name,
        cd.created_at,
        cd.updated_at,
        cd.participants,
        cd.latest_message,
        cd.unread_count
    FROM chat_details cd
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(cd.participants) p 
        WHERE p->>'user_id' = user_id::text
    )
    ORDER BY cd.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_chat_details(UUID) TO authenticated;