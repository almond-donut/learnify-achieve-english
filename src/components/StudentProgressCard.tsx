import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/hooks/useGamification';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Flame, 
  Target, 
  Award,
  Zap,
  Crown,
  Medal
} from 'lucide-react';

interface StudentProgressProps {
  studentId: string;
  showAchievements?: boolean;
}

interface StudentStats {
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  avatar_url?: string;
}

interface RecentAchievement {
  id: string;
  achievement: {
    name: string;
    badge_icon: string;
    points_reward: number;
  };
  earned_at: string;
}

export const StudentProgressCard: React.FC<StudentProgressProps> = ({ 
  studentId, 
  showAchievements = true 
}) => {
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { calculateLevel, getPointsForNextLevel } = useGamification(studentId);

  useEffect(() => {
    fetchStudentData();
    if (showAchievements) {
      fetchRecentAchievements();
    }
  }, [studentId, showAchievements]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('name, total_points, level, current_streak, avatar_url')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudentStats(data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievement:achievements(
            name,
            badge_icon,
            points_reward
          )
        `)
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentAchievements(data || []);
    } catch (error) {
      console.error('Error fetching recent achievements:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentStats) {
    return null;
  }

  const currentLevel = studentStats.level;
  const currentPoints = studentStats.total_points;
  const pointsForCurrentLevel = currentLevel > 1 ? Math.pow(currentLevel - 1, 2) * 100 : 0;
  const pointsForNextLevel = getPointsForNextLevel(currentLevel);
  const progressInCurrentLevel = currentPoints - pointsForCurrentLevel;
  const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const levelProgress = (progressInCurrentLevel / pointsNeededForNextLevel) * 100;

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Crown className="h-5 w-5 text-purple-500" />;
    if (level >= 25) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (level >= 10) return <Trophy className="h-5 w-5 text-blue-500" />;
    return <Star className="h-5 w-5 text-green-500" />;
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 50) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (level >= 25) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (level >= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-orange-600';
    if (streak >= 7) return 'text-red-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {studentStats.avatar_url ? (
              <img 
                src={studentStats.avatar_url} 
                alt={studentStats.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {studentStats.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {studentStats.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${getLevelBadgeColor(currentLevel)} border`}>
                  {getLevelIcon(currentLevel)}
                  <span className="ml-1">Level {currentLevel}</span>
                </Badge>
                {studentStats.current_streak > 0 && (
                  <Badge variant="outline" className="border-orange-200 bg-orange-50">
                    <Flame className={`h-3 w-3 mr-1 ${getStreakColor(studentStats.current_streak)}`} />
                    <span className={getStreakColor(studentStats.current_streak)}>
                      {studentStats.current_streak} day streak
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-2xl font-bold text-blue-600">
              <Star className="h-5 w-5" />
              <span>{currentPoints.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500">Total Points</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Level Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-gray-700">Level Progress</span>
            </div>
            <span className="text-sm text-gray-500">
              {progressInCurrentLevel.toLocaleString()} / {pointsNeededForNextLevel.toLocaleString()} XP
            </span>
          </div>
          <Progress value={Math.min(levelProgress, 100)} className="h-3" />
          <p className="text-xs text-gray-500">
            {Math.max(0, pointsNeededForNextLevel - progressInCurrentLevel).toLocaleString()} points to level {currentLevel + 1}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Trophy className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-700">{currentLevel}</p>
            <p className="text-xs text-blue-600">Level</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700">{currentPoints.toLocaleString()}</p>
            <p className="text-xs text-green-600">Points</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-700">{studentStats.current_streak}</p>
            <p className="text-xs text-orange-600">Day Streak</p>
          </div>
        </div>

        {/* Recent Achievements */}
        {showAchievements && recentAchievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-gray-700">Recent Achievements</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/achievements'}>
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {recentAchievements.map((userAchievement) => (
                <div 
                  key={userAchievement.id}
                  className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <span className="text-xl">{userAchievement.achievement.badge_icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 text-sm">
                      {userAchievement.achievement.name}
                    </p>
                    <p className="text-xs text-yellow-600">
                      Earned {new Date(userAchievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    <Zap className="h-3 w-3 mr-1" />
                    +{userAchievement.achievement.points_reward}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational message based on streak */}
        {studentStats.current_streak > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <p className="text-sm font-medium text-orange-800">
                {studentStats.current_streak >= 7 
                  ? `Amazing! You're on fire with a ${studentStats.current_streak}-day streak! 🔥`
                  : studentStats.current_streak >= 3
                  ? `Great job! Keep the momentum going! 💪`
                  : `You're building a great habit! Keep it up! 🌟`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
