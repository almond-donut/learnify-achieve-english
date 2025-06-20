-- SQL untuk membuat akun guru dengan email guru@guru.com dan password 123456

-- 1. Tambahkan user ke auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'guru@guru.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Guru Demo"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- 2. Ambil ID yang baru dibuat untuk digunakan pada langkah berikutnya
DO $$ 
DECLARE 
  auth_user_id uuid;
BEGIN
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'guru@guru.com';

  -- 3. Tambahkan guru ke tabel teachers
  INSERT INTO public.teachers (
    id, 
    name, 
    email, 
    created_at
  ) VALUES (
    auth_user_id, 
    'Guru Demo', 
    'guru@guru.com', 
    now()
  );

  -- 4. Tambahkan profil dengan role 'teacher' ke user_profiles
  INSERT INTO public.user_profiles (
    id,
    role,
    teacher_id,
    created_at
  ) VALUES (
    auth_user_id,
    'teacher',
    auth_user_id,
    now()
  );

  -- 5. Buat kelas untuk guru ini
  INSERT INTO public.classes (
    name,
    teacher_id,
    created_at
  ) VALUES (
    'Kelas Demo',
    auth_user_id,
    now()
  );
END $$;