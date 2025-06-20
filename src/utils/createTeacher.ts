import { supabase } from '@/integrations/supabase/client';

export const createTeacherAccount = async () => {
  try {
    console.log('Creating teacher account...');
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'guru@guru.com',
      password: '123456',
      options: {
        data: {
          role: 'teacher'
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData);

    if (!authData.user) {
      throw new Error('No user returned from signup');
    }

    // Wait a moment for the user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        role: 'teacher',
        username: 'guru'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Don't throw here, continue to create teacher record
    }

    // Create teacher record
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: authData.user.id,
        name: 'Guru Teacher',
        email: 'guru@guru.com'
      });

    if (teacherError) {
      console.error('Teacher error:', teacherError);
      throw teacherError;
    }

    // Create a default class
    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: 'Default Class',
        teacher_id: authData.user.id
      });

    if (classError) {
      console.error('Class error:', classError);
      // Don't throw here, class creation is optional
    }

    console.log('Teacher account created successfully!');
    return { success: true, user: authData.user };
    
  } catch (error) {
    console.error('Error creating teacher account:', error);
    return { success: false, error };
  }
};
