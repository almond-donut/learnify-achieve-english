
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, BarChart3, PlusCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import StudentsManagement from '@/pages/teacher/StudentsManagement';
import QuizManagement from '@/pages/teacher/QuizManagement';

const TeacherDashboardHome = () => {
  const { teacherData } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome back, {teacherData?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">24</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Active Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> created this week
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">85%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Avg Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">78%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Common tasks you can perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/teacher/students">
                <Button className="w-full h-20 flex flex-col items-center justify-center">
                  <Users className="w-6 h-6 mb-2" />
                  Manage Students
                </Button>
              </Link>
              <Link to="/teacher/quizzes">
                <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                  <PlusCircle className="w-6 h-6 mb-2" />
                  Create Quiz
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium dark:text-white">New student enrolled</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sarah Johnson joined</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">2 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium dark:text-white">Quiz completed</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Grammar Basics - 95% score</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium dark:text-white">Quiz created</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vocabulary Challenge</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TeacherDashboardHome />} />
        <Route path="/students" element={<StudentsManagement />} />
        <Route path="/quizzes" element={<QuizManagement />} />
        <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold dark:text-white">Reports (Coming Soon)</h1></div>} />
        <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold dark:text-white">Settings (Coming Soon)</h1></div>} />
      </Routes>
    </Layout>
  );
};

export default TeacherDashboard;
