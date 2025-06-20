/**
 * This is a utility script for creating a teacher account manually.
 * Run these functions in the browser console on the login page.
 * 
 * HOW TO USE:
 * 1. Open Chrome DevTools (F12 or right-click > Inspect)
 * 2. Go to the Console tab
 * 3. Copy this entire file and paste it in the console
 * 4. Run createTeacherAccount() function
 * 5. If successful, login with guru@guru.com / 123456
 */

import { supabase } from '@/integrations/supabase/client';

// Step 1: Sign up the teacher user with auth
async function createTeacherAuthAccount() {
  console.log("Creating teacher auth account...");
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'guru@guru.com',
      password: '123456',
      options: {
        data: {
          role: 'teacher'
        },
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
    console.log("Auth account created successfully:", data);
    return data.user;
  } catch (error) {
    console.error("Error creating auth account:", error);
    throw error;
  }
}

// Step 2: Create teacher profile in database
async function createTeacherProfileAndData(userId) {
  console.log("Creating teacher profile for user ID:", userId);
  
  try {
    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        role: 'teacher',
        username: 'guru'
      });
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Continue anyway
    } else {
      console.log("User profile created successfully");
    }
    
    // Create teacher record
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: userId,
        name: 'Guru Teacher',
        email: 'guru@guru.com'
      });
    
    if (teacherError) {
      console.error("Error creating teacher record:", teacherError);
      throw teacherError;
    }
    
    console.log("Teacher record created successfully");
    
    // Create a default class
    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: 'Default Class',
        teacher_id: userId
      });
    
    if (classError) {
      console.error("Error creating class:", classError);
      // Continue anyway
    } else {
      console.log("Default class created successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error creating teacher data:", error);
    throw error;
  }
}

// Main function to create the teacher account
async function createTeacherAccount() {
  try {
    console.log("Starting teacher account creation process...");
    
    // Step 1: Create auth account
    const user = await createTeacherAuthAccount();
    if (!user) {
      console.error("Failed to create auth user");
      return false;
    }
    
    // Step 2: Create profile and data
    await createTeacherProfileAndData(user.id);
    
    console.log("✅ TEACHER ACCOUNT CREATED SUCCESSFULLY!");
    console.log("Login with: guru@guru.com / 123456");
    
    return true;
  } catch (error) {
    console.error("Failed to create teacher account:", error);
    return false;
  }
}

// Export the function to make it accessible from browser console
window.createTeacherAccount = createTeacherAccount;
