import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Flame, 
  TrendingUp,
  Crown,
  Target,
  Zap
} from 'lucide-react';

interface LeaderboardStudent {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  avatar_url?: string;
  class_name?: string;
}

interface LeaderboardProps {
  currentStudentId?: string;
  classId?: string;
  showClassFilter?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  currentStudentId, 
  classId,
  showClassFilter = false 
}) => {
  const [pointsLeaders, setPointsLeaders] = useState<LeaderboardStudent[]>([]);
  const [levelLeaders, setLevelLeaders] = useState<LeaderboardStudent[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, [classId]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select(`
          id,
          name,
          total_points,
          level,
          current_streak,
          avatar_url,
          class:classes(name)
        `);

      // Filter by class if specified
      if (classId) {
        query = query.eq('class_id', classId);
      }

      // Points leaderboard
      const { data: pointsData, error: pointsError } = await query
        .order('total_points', { ascending: false })
        .limit(10);

      if (pointsError) throw pointsError;

      // Level leaderboard  
      const { data: levelData, error: levelError } = await query
        .order('level', { ascending: false })
        .order('total_points', { ascending: false })
        .limit(10);

      if (levelError) throw levelError;

      // Streak leaderboard
      const { data: streakData, error: streakError } = await query
        .order('current_streak', { ascending: false })
        .order('total_points', { ascending: false })
        .limit(10);

      if (streakError) throw streakError;

      setPointsLeaders(pointsData?.map(student => ({
        ...student,
        class_name: (student as any).class?.name
      })) || []);
      
      setLevelLeaders(levelData?.map(student => ({
        ...student,
        class_name: (student as any).class?.name
      })) || []);
      
      setStreakLeaders(streakData?.map(student => ({
        ...student,
        class_name: (student as any).class?.name
      })) || []);

    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="font-bold text-gray-500">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const LeaderboardCard: React.FC<{
    students: LeaderboardStudent[];
    title: string;
    metric: 'points' | 'level' | 'streak';
    icon: React.ReactNode;
  }> = ({ students, title, metric, icon }) => {
    const getMetricDisplay = (student: LeaderboardStudent) => {
      switch (metric) {
        case 'points':
          return student.total_points.toLocaleString();
        case 'level':
          return `Level ${student.level}`;
        case 'streak':
          return `${student.current_streak} days`;
        default:
          return '';
      }
    };

    const getMetricIcon = (student: LeaderboardStudent) => {
      switch (metric) {
        case 'points':
          return <Star className="h-4 w-4 text-blue-500" />;
        case 'level':
          return <TrendingUp className="h-4 w-4 text-green-500" />;
        case 'streak':
          return <Flame className="h-4 w-4 text-orange-500" />;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-3">
        {students.map((student, index) => {
          const position = index + 1;
          const isCurrentStudent = student.id === currentStudentId;
          
          return (
            <div 
              key={student.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                isCurrentStudent 
                  ? 'bg-blue-50 border-blue-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10">
                {position <= 3 ? (
                  <Badge className={`${getRankBadgeColor(position)} border flex items-center`}>
                    {getRankIcon(position)}
                  </Badge>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="font-bold text-gray-600 text-sm">#{position}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 flex-1">
                {student.avatar_url ? (
                  <img 
                    src={student.avatar_url} 
                    alt={student.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1">
                  <p className={`font-medium ${isCurrentStudent ? 'text-blue-900' : 'text-gray-900'}`}>
                    {student.name}
                    {isCurrentStudent && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-300">
                        You
                      </Badge>
                    )}
                  </p>
                  {student.class_name && (
                    <p className="text-xs text-gray-500">{student.class_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-right">
                {getMetricIcon(student)}
                <span className={`font-bold ${
                  position === 1 ? 'text-yellow-600' :
                  position === 2 ? 'text-gray-600' :
                  position === 3 ? 'text-orange-600' :
                  'text-gray-700'
                }`}>
                  {getMetricDisplay(student)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Leaderboard</span>
          {classId && (
            <Badge variant="outline" className="ml-2">
              Class Only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Points</span>
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Levels</span>
            </TabsTrigger>
            <TabsTrigger value="streaks" className="flex items-center space-x-2">
              <Flame className="h-4 w-4" />
              <span>Streaks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="mt-6">
            <LeaderboardCard
              students={pointsLeaders}
              title="Top Points"
              metric="points"
              icon={<Star className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="levels" className="mt-6">
            <LeaderboardCard
              students={levelLeaders}
              title="Highest Levels"
              metric="level"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="streaks" className="mt-6">
            <LeaderboardCard
              students={streakLeaders}
              title="Longest Streaks"
              metric="streak"
              icon={<Flame className="h-5 w-5" />}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
