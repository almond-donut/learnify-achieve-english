import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { AchievementCard } from '@/components/ui/AchievementCard';
import { Trophy, Star, Clock, Target, Medal, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon: string;
  requirements: any;
  points_reward: number;
  created_at: string;
}

interface UserAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

interface StudentStats {
  totalQuizzes: number;
  perfectScores: number;
  totalCorrect: number;
  differentDays: number;
  currentStreak: number;
  totalPoints: number;
  fastestTime: number;
  highestScore: number;
}

export const AchievementsDashboard: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
    fetchUserAchievements();
    fetchStudentStats();
  }, [studentId]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points_reward', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchUserAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  };

  const fetchStudentStats = async () => {
    try {
      // Get student basic info
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

      // Calculate stats
      const totalQuizzes = quizData?.length || 0;
      const perfectScores = quizData?.filter(q => q.score === 100).length || 0;
      const totalCorrect = quizData?.reduce((sum, q) => sum + q.correct_answers, 0) || 0;
      const fastestTime = Math.min(...(quizData?.map(q => q.time_taken).filter(t => t > 0) || [Infinity]));
      const highestScore = Math.max(...(quizData?.map(q => q.score) || [0]));
      
      // Calculate different days
      const uniqueDays = new Set(
        quizData?.map(q => new Date(q.completed_at).toDateString()) || []
      ).size;

      setStudentStats({
        totalQuizzes,
        perfectScores,
        totalCorrect,
        differentDays: uniqueDays,
        currentStreak: studentData?.current_streak || 0,
        totalPoints: studentData?.total_points || 0,
        fastestTime: fastestTime === Infinity ? 0 : fastestTime,
        highestScore
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForAchievement = (achievement: Achievement): { current: number; max: number } => {
    if (!studentStats) return { current: 0, max: 1 };

    const { requirements } = achievement;
    const target = requirements.target;

    switch (requirements.type) {
      case 'quiz_count':
        return { current: studentStats.totalQuizzes, max: target };
      case 'perfect_count':
        return { current: studentStats.perfectScores, max: target };
      case 'correct_answers':
        return { current: studentStats.totalCorrect, max: target };
      case 'different_days':
        return { current: studentStats.differentDays, max: target };
      case 'daily_streak':
        return { current: studentStats.currentStreak, max: target };
      case 'total_points':
        return { current: studentStats.totalPoints, max: target };
      case 'quick_completion':
        return { 
          current: studentStats.fastestTime > 0 && studentStats.fastestTime <= target ? 1 : 0, 
          max: 1 
        };
      case 'perfect_score':
      case 'accuracy_score':
        return { 
          current: studentStats.highestScore >= target ? 1 : 0, 
          max: 1 
        };
      default:
        return { current: 0, max: 1 };
    }
  };

  const categorizeAchievements = () => {
    const categories = {
      earned: achievements.filter(a => 
        userAchievements.some(ua => ua.achievement_id === a.id)
      ),
      inProgress: achievements.filter(a => {
        const isEarned = userAchievements.some(ua => ua.achievement_id === a.id);
        if (isEarned) return false;
        
        const { current, max } = getProgressForAchievement(a);
        return current > 0 && current < max;
      }),
      locked: achievements.filter(a => {
        const isEarned = userAchievements.some(ua => ua.achievement_id === a.id);
        if (isEarned) return false;
        
        const { current, max } = getProgressForAchievement(a);
        return current === 0;
      })
    };

    return categories;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = categorizeAchievements();
  const earnedCount = categories.earned.length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold">{earnedCount}/{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold">{studentStats?.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold">{studentStats?.currentStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold">{completionPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Medal className="h-5 w-5" />
            <span>Achievement Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall completion</span>
              <span>{earnedCount} of {totalCount} achievements</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earned" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Earned ({categories.earned.length})</span>
          </TabsTrigger>
          <TabsTrigger value="inProgress" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>In Progress ({categories.inProgress.length})</span>
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Locked ({categories.locked.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.earned.map(achievement => {
              const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  userAchievement={userAchievement}
                />
              );
            })}
          </div>
          {categories.earned.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No achievements earned yet. Keep learning to unlock your first achievement!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inProgress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.inProgress.map(achievement => {
              const { current, max } = getProgressForAchievement(achievement);
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={current}
                  maxProgress={max}
                />
              );
            })}
          </div>
          {categories.inProgress.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No achievements in progress. Start a quiz to begin working towards your goals!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.locked.map(achievement => {
              const { current, max } = getProgressForAchievement(achievement);
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={current}
                  maxProgress={max}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
