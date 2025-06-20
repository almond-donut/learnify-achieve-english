import { supabase } from './src/integrations/supabase/client';

export const createTeacherDirectly = async () => {
  // This will be called from terminal using node
  const { createClient } = require('@supabase/supabase-js');
  
  // You'll need to replace these with your actual Supabase URL and anon key
  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'guru@guru.com',
      password: '123456'
    });
    
    console.log('Teacher account created:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
