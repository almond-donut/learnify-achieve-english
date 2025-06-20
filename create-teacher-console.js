// Run this in your browser console (F12 -> Console tab) when on the app page
// This will create the teacher account directly

async function createTeacherAccount() {
  console.log('Creating teacher account...');
  
  try {
    // Import Supabase client
    const { supabase } = await import('./src/integrations/supabase/client');
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'guru@guru.com',
      password: '123456'
    });

    if (authError) throw authError;
    console.log('Auth user created:', authData);

    if (!authData.user) throw new Error('No user returned');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        role: 'teacher',
        username: 'guru'
      });

    if (profileError) console.warn('Profile error:', profileError);

    // Create teacher record
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: authData.user.id,
        name: 'Guru Teacher',
        email: 'guru@guru.com'
      });

    if (teacherError) throw teacherError;

    // Create default class
    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: 'Default Class',
        teacher_id: authData.user.id
      });

    if (classError) console.warn('Class error:', classError);

    console.log('✅ Teacher account created successfully!');
    console.log('📧 Email: guru@guru.com');
    console.log('🔑 Password: 123456');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error creating teacher account:', error);
    return { success: false, error };
  }
}

// Call the function
createTeacherAccount();
