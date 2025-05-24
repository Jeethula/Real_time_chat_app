ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


CREATE POLICY "Users can view other users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);


GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;


UPDATE public.users 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE public.users 
SET created_at = NOW() 
WHERE created_at IS NULL;