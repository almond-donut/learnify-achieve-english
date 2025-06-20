
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Star, Play, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import TakeQuiz from '@/pages/student/TakeQuiz';
import Leaderboard from '@/pages/student/Leaderboard';

const StudentDashboardHome = () => {
  const { studentData } = useAuth();

  const currentLevel = studentData?.level || 1;
  const totalPoints = studentData?.total_points || 0;
  const currentStreak = studentData?.current_streak || 0;
  
  // Calculate XP progress (example: 100 points per level)
  const pointsForNextLevel = currentLevel * 100;
  const pointsInCurrentLevel = totalPoints % 100;
  const progressPercentage = (pointsInCurrentLevel / 100) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">L{currentLevel}</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{totalPoints} Points</h2>
              <p className="text-blue-100 mb-4">Level {currentLevel} English Learner</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>{currentStreak} day streak</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Trophy className="w-4 h-4 mr-1" />
                  #3 in class
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <Link to="/student/quiz">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Play className="w-5 h-5 mr-2" />
                Take Quiz
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Progress to Level {currentLevel + 1}</span>
            <span className="text-sm">{pointsInCurrentLevel}/100 XP</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-white/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Target className="w-5 h-5 text-blue-600" />
              Today's Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold dark:text-white">2/3 Quizzes</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete 1 more quiz to reach your daily goal!</p>
              <Progress value={66} className="h-2" />
              <Link to="/student/quiz">
                <Button className="w-full" size="sm">
                  Continue Learning
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Users className="w-5 h-5 text-green-600" />
              Class Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-green-600">#3</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of 24 students in your class</p>
              <Link to="/student/leaderboard">
                <Button className="w-full" variant="outline" size="sm">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Award className="w-5 h-5 text-yellow-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-yellow-600">12/20</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Badges earned this month</p>
              <Button className="w-full" variant="outline" size="sm">
                View All Badges
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="font-medium dark:text-white">First Steps</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed your first quiz</p>
                </div>
                <Badge variant="secondary">+50 XP</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl">⭐</div>
                <div>
                  <p className="font-medium dark:text-white">Perfect Score</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Got 100% on a quiz</p>
                </div>
                <Badge variant="secondary">+100 XP</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl">🔥</div>
                <div>
                  <p className="font-medium dark:text-white">Streak Keeper</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">7-day login streak</p>
                </div>
                <Badge variant="secondary">+300 XP</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Available Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="font-medium dark:text-white">Grammar Fundamentals</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">10 questions • 5 min</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">Easy</Badge>
                    <span className="text-sm text-green-600 dark:text-green-400">+50 XP</span>
                  </div>
                </div>
                <Link to="/student/quiz">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="font-medium dark:text-white">Vocabulary Builder</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">15 questions • 8 min</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">Medium</Badge>
                    <span className="text-sm text-green-600 dark:text-green-400">+75 XP</span>
                  </div>
                </div>
                <Link to="/student/quiz">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="font-medium dark:text-white">Reading Comprehension</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">12 questions • 15 min</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">Hard</Badge>
                    <span className="text-sm text-green-600 dark:text-green-400">+100 XP</span>
                  </div>
                </div>
                <Link to="/student/quiz">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StudentDashboardHome />} />
        <Route path="/quiz" element={<TakeQuiz />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<div className="p-6"><h1 className="text-2xl font-bold dark:text-white">Achievements (Coming Soon)</h1></div>} />
        <Route path="/profile" element={<div className="p-6"><h1 className="text-2xl font-bold dark:text-white">Profile (Coming Soon)</h1></div>} />
      </Routes>
    </Layout>
  );
};

export default StudentDashboard;
