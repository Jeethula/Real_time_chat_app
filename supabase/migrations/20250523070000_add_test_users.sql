-- Add test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  ('d0d54660-91d4-4d10-8d47-e3ddfc63f19d', 'john@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"John Smith"}'),
  ('e1d54661-91d4-4d10-8d47-e3ddfc63f19e', 'emma@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"Emma Watson"}'),
  ('f2d54662-91d4-4d10-8d47-e3ddfc63f19f', 'michael@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"Michael Brown"}'),
  ('g3d54663-91d4-4d10-8d47-e3ddfc63f20g', 'sarah@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"Sarah Parker"}');

-- Add corresponding user profiles
INSERT INTO public.users (id, username, avatar_url, created_at, last_seen)
VALUES
  ('d0d54660-91d4-4d10-8d47-e3ddfc63f19d', 'John Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', now(), now()),
  ('e1d54661-91d4-4d10-8d47-e3ddfc63f19e', 'Emma Watson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', now(), now()),
  ('f2d54662-91d4-4d10-8d47-e3ddfc63f19f', 'Michael Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', now(), now()),
  ('g3d54663-91d4-4d10-8d47-e3ddfc63f20g', 'Sarah Parker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', now(), now());

-- Create some initial chats
INSERT INTO public.chats (id, is_group_chat, created_at, updated_at)
VALUES
  ('c1d54664-91d4-4d10-8d47-e3ddfc63f21h', false, now(), now()),
  ('c2d54665-91d4-4d10-8d47-e3ddfc63f22i', false, now(), now());

-- Add chat participants
INSERT INTO public.chat_participants (chat_id, user_id, joined_at)
VALUES
  ('c1d54664-91d4-4d10-8d47-e3ddfc63f21h', 'd0d54660-91d4-4d10-8d47-e3ddfc63f19d', now()),
  ('c1d54664-91d4-4d10-8d47-e3ddfc63f21h', 'e1d54661-91d4-4d10-8d47-e3ddfc63f19e', now()),
  ('c2d54665-91d4-4d10-8d47-e3ddfc63f22i', 'd0d54660-91d4-4d10-8d47-e3ddfc63f19d', now()),
  ('c2d54665-91d4-4d10-8d47-e3ddfc63f22i', 'f2d54662-91d4-4d10-8d47-e3ddfc63f19f', now());

-- Add some initial messages
INSERT INTO public.messages (id, chat_id, user_id, content, created_at, is_read)
VALUES
  ('m1d54666-91d4-4d10-8d47-e3ddfc63f23j', 'c1d54664-91d4-4d10-8d47-e3ddfc63f21h', 'd0d54660-91d4-4d10-8d47-e3ddfc63f19d', 'Hey Emma, how are you?', now(), true),
  ('m2d54667-91d4-4d10-8d47-e3ddfc63f24k', 'c1d54664-91d4-4d10-8d47-e3ddfc63f21h', 'e1d54661-91d4-4d10-8d47-e3ddfc63f19e', 'Hi John! I''m good, thanks!', now(), true),
  ('m3d54668-91d4-4d10-8d47-e3ddfc63f25l', 'c2d54665-91d4-4d10-8d47-e3ddfc63f22i', 'd0d54660-91d4-4d10-8d47-e3ddfc63f19d', 'Hello Michael!', now(), true),
  ('m4d54669-91d4-4d10-8d47-e3ddfc63f26m', 'c2d54665-91d4-4d10-8d47-e3ddfc63f22i', 'f2d54662-91d4-4d10-8d47-e3ddfc63f19f', 'Hi John, great to hear from you!', now(), true);