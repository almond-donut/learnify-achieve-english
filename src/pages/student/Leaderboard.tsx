
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  total_points: number;
  level: number;
  current_streak: number;
  rank: number;
}

const Leaderboard = () => {
  const { studentData } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, total_points, level, current_streak')
        .order('total_points', { ascending: false })
        .limit(50);

      if (error) throw error;

      const leaderboardWithRanks = (data || []).map((student, index) => ({
        ...student,
        rank: index + 1,
      }));

      setLeaderboard(leaderboardWithRanks);

      // Find current user's rank
      if (studentData) {
        const currentUserRank = leaderboardWithRanks.find(
          entry => entry.id === studentData.id
        )?.rank;
        setUserRank(currentUserRank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [studentData]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{rank}</span>
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/30 dark:to-gray-600/20 border-gray-200 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-300">See how you stack up against other students</p>
        
        {userRank && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
            <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Your Rank: #{userRank}
            </span>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((student, index) => (
          <Card 
            key={student.id} 
            className={`text-center ${getRankColor(student.rank)} ${
              student.id === studentData?.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-2">
                {getRankIcon(student.rank)}
              </div>
              <CardTitle className="text-lg dark:text-white">{student.name}</CardTitle>
              {student.id === studentData?.id && (
                <Badge variant="outline" className="mx-auto dark:border-blue-400 dark:text-blue-400">
                  You
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {student.total_points}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  Level {student.level}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Full Rankings
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            Top {leaderboard.length} students by total points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  student.id === studentData?.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(student.rank)}
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white">
                      {student.name}
                      {student.id === studentData?.id && (
                        <Badge variant="outline" className="ml-2 text-xs dark:border-blue-400 dark:text-blue-400">
                          You
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Level {student.level} • {student.current_streak} day streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {student.total_points}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
