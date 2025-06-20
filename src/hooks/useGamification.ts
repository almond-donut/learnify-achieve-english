import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemory } from '@/contexts/MemoryContext';

interface NewAchievement {
  achievement_id: string;
  achievement_name: string;
}

export const useGamification = (studentId: string | null) => {
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);
  const { addMemory, recordLearningSession, generateInsights } = useMemory();

  // Enhanced achievement checking with memory integration
  const checkAchievements = async (context?: {
    activityType?: string;
    performance?: any;
    duration?: number;
  }) => {
    if (!studentId || isCheckingAchievements) return;

    setIsCheckingAchievements(true);
    
    try {
      // Record learning context in memory if provided
      if (context?.activityType && context?.performance) {
        recordLearningSession(
          context.activityType,
          context.performance,
          context.duration || 0
        );
      }

      // For now, we'll implement a simple client-side achievement check
      // In the future, you can call the database function when it's properly typed
      
      // Get student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('total_points, current_streak, level')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get quiz statistics
      const { data: quizData, error: quizError } = await supabase
        .from('user_quiz_attempts')
        .select('score, correct_answers, time_taken, completed_at')
        .eq('student_id', studentId);

      if (quizError) throw quizError;

      // Get all achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError) throw achievementsError;

      // Get already earned achievements
      const { data: earnedAchievements, error: earnedError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('student_id', studentId);

      if (earnedError) throw earnedError;

      const earnedIds = new Set(earnedAchievements?.map(ea => ea.achievement_id) || []);
      
      // Simple achievement checking logic
      const newlyEarned: NewAchievement[] = [];
      
      achievements?.forEach(achievement => {
        if (earnedIds.has(achievement.id)) return;
        
        const requirements = achievement.requirements as any;
        let shouldEarn = false;
        
        // Simple checks for common achievement types
        switch (requirements.type) {
          case 'quiz_count':
            shouldEarn = (quizData?.length || 0) >= requirements.target;
            break;
          case 'total_points':
            shouldEarn = (studentData?.total_points || 0) >= requirements.target;
            break;
          case 'daily_streak':
            shouldEarn = (studentData?.current_streak || 0) >= requirements.target;
            break;
          case 'perfect_score':
            shouldEarn = quizData?.some(q => q.score >= requirements.target) || false;
            break;
          case 'correct_answers':
            const totalCorrect = quizData?.reduce((sum, q) => sum + q.correct_answers, 0) || 0;
            shouldEarn = totalCorrect >= requirements.target;
            break;
        }
        
        if (shouldEarn) {
          newlyEarned.push({
            achievement_id: achievement.id,
            achievement_name: achievement.name
          });
        }
      });
        // Award new achievements
      for (const newAchievement of newlyEarned) {
        await supabase
          .from('user_achievements')
          .insert({
            student_id: studentId,
            achievement_id: newAchievement.achievement_id
          });
        
        // Award points
        const achievement = achievements?.find(a => a.id === newAchievement.achievement_id);
        if (achievement?.points_reward) {
          await awardPoints(achievement.points_reward);
        }

        // Record achievement in memory bank
        addMemory(
          'achievement_unlocked',
          {
            achievement_id: newAchievement.achievement_id,
            achievement_name: newAchievement.achievement_name,
            points_awarded: achievement?.points_reward || 0,
            unlock_context: context || {},
            student_stats: studentData
          },
          ['achievement', 'unlock', 'gamification'],
          0.9 // High importance for achievements
        );
      }
      
      if (newlyEarned.length > 0) {
        setNewAchievements(prev => [...prev, ...newlyEarned]);
        
        // Show toast notifications for new achievements
        newlyEarned.forEach((achievement: NewAchievement) => {
          toast.success(`🏆 Achievement Unlocked: ${achievement.achievement_name}!`, {
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // You can navigate to achievements page here
                window.location.href = '/achievements';
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error in checkAchievements:', error);
    } finally {
      setIsCheckingAchievements(false);
    }
  };

  // Update student streak
  const updateStreak = async () => {
    if (!studentId) return;

    try {
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('last_login, current_streak')
        .eq('id', studentId)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastLogin = student.last_login ? new Date(student.last_login) : null;
      const lastLoginDate = lastLogin ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()) : null;

      let newStreak = 1;

      if (lastLoginDate) {
        const diffTime = today.getTime() - lastLoginDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day, don't update streak
          return;
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak = (student.current_streak || 0) + 1;
        } else {
          // Gap in days, reset streak
          newStreak = 1;
        }
      }

      // Update last login and streak
      const { error: updateError } = await supabase
        .from('students')
        .update({
          last_login: now.toISOString(),
          current_streak: newStreak
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      // Check for streak achievements
      await checkAchievements();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Calculate student level based on points
  const calculateLevel = (points: number): number => {
    return Math.max(1, Math.floor(Math.sqrt(points / 100)) + 1);
  };

  // Get points needed for next level
  const getPointsForNextLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel, 2) * 100;
  };

  // Listen for real-time achievement updates
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel('achievement-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('New achievement earned:', payload);
          // You could fetch the achievement details here and show notification
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  // Clear processed achievements
  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  // Get student's current stats
  const getStudentStats = async () => {
    if (!studentId) return null;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('total_points, level, current_streak')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      return null;
    }
  };
  // Award points to student
  const awardPoints = async (points: number) => {
    if (!studentId || points <= 0) return;

    try {
      // First get current points
      const { data: currentData, error: fetchError } = await supabase
        .from('students')
        .select('total_points')
        .eq('id', studentId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (currentData?.total_points || 0) + points;

      const { error } = await supabase
        .from('students')
        .update({
          total_points: newTotal
        })
        .eq('id', studentId);

      if (error) throw error;

      // Check for achievements after awarding points
      await checkAchievements();
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };
  // Get personalized learning insights
  const getPersonalizedInsights = () => {
    return generateInsights();
  };

  // Record quiz completion with memory integration
  const recordQuizCompletion = async (quizData: {
    score: number;
    correct_answers: number;
    time_taken: number;
    total_questions: number;
    topic?: string;
  }) => {
    if (!studentId) return;

    const performance = {
      score: quizData.score,
      accuracy: quizData.correct_answers / quizData.total_questions,
      time_per_question: quizData.time_taken / quizData.total_questions
    };

    // Record in memory
    recordLearningSession(
      'quiz_completion',
      performance,
      quizData.time_taken
    );

    // Add detailed memory entry
    addMemory(
      'quiz_result',
      {
        ...quizData,
        performance,
        timestamp: new Date().toISOString()
      },
      ['quiz', 'assessment', quizData.topic || 'general'],
      performance.score > 0.8 ? 0.8 : 0.6
    );

    // Check for achievements with context
    await checkAchievements({
      activityType: 'quiz',
      performance,
      duration: quizData.time_taken
    });
  };

  return {
    newAchievements,
    isCheckingAchievements,
    checkAchievements,
    updateStreak,
    calculateLevel,
    getPointsForNextLevel,
    clearNewAchievements,
    getStudentStats,
    awardPoints,
    getPersonalizedInsights,
    recordQuizCompletion
  };
};
