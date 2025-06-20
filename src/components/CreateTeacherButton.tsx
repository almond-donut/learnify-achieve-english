import React from 'react';
import { Button } from '@/components/ui/button';
import { createTeacherAccount } from '@/utils/createTeacher';
import { toast } from 'sonner';

export const CreateTeacherButton = () => {
  const handleCreateTeacher = async () => {
    const result = await createTeacherAccount();
    
    if (result.success) {
      toast.success('Teacher account created successfully! You can now login with guru@guru.com / 123456');
    } else {
      toast.error('Failed to create teacher account: ' + (result.error?.message || 'Unknown error'));
    }
  };

  return (
    <Button 
      onClick={handleCreateTeacher}
      className="bg-purple-600 hover:bg-purple-700 text-white"
    >
      Create Teacher Account (guru@guru.com)
    </Button>
  );
};
