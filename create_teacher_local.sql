-- SQL untuk membuat akun guru di database lokal Supabase
-- Email: guru@guru.com, Password: 123456

-- 1. Buat akun di auth.users terlebih dahulu
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    phone_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    instance_id,
    encrypted_password
) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'guru@guru.com',
    now(),
    NULL,
    '',
    '',
    '',
    '',
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Guru Demo"}',
    false,
    now(),
    now(),
    '00000000-0000-0000-0000-000000000000',
    crypt('123456', gen_salt('bf'))
);

-- 2. Sekarang kita akan menggunakan ID yang baru dibuat
DO $$ 
DECLARE 
    teacher_user_id uuid;
BEGIN
    -- Ambil ID user yang baru dibuat
    SELECT id INTO teacher_user_id FROM auth.users WHERE email = 'guru@guru.com';
    
    -- 3. Buat record di tabel teachers
    INSERT INTO public.teachers (
        id,
        name,
        email,
        created_at,
        updated_at
    ) VALUES (
        teacher_user_id,
        'Guru Demo',
        'guru@guru.com',
        now(),
        now()
    );
    
    -- 4. Buat user profile
    INSERT INTO public.user_profiles (
        id,
        role,
        teacher_id,
        created_at
    ) VALUES (
        teacher_user_id,
        'teacher',
        teacher_user_id,
        now()
    );
    
    -- 5. Buat kelas demo
    INSERT INTO public.classes (
        name,
        teacher_id,
        created_at
    ) VALUES (
        'Kelas 7A - Demo',
        teacher_user_id,
        now()
    ), (
        'Kelas 8B - Demo',
        teacher_user_id,
        now()
    );
    
    RAISE NOTICE 'Akun guru berhasil dibuat dengan ID: %', teacher_user_id;
END $$;
