
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMIT;


CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, avatar_url, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = COALESCE(EXCLUDED.username, SPLIT_PART(NEW.email, '@', 1)),
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


INSERT INTO public.users (id, username, avatar_url, email, created_at, updated_at)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)) as username,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    email,
    COALESCE(created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    updated_at = NOW();


UPDATE public.users 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE public.users 
SET created_at = NOW() 
WHERE created_at IS NULL;