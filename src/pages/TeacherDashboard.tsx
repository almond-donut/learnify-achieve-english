
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, BarChart3, Settings, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { teacherData, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome back, {teacherData?.name}</p>
            </div>
            <Button onClick={signOut} variant="outline">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Students
              </CardTitle>
              <CardDescription>Manage your students and classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">24</div>
                <p className="text-sm text-gray-600">Total students across all classes</p>
                <Link to="/teacher/students">
                  <Button className="w-full">Manage Students</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Quizzes
              </CardTitle>
              <CardDescription>Create and manage quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-600">12</div>
                <p className="text-sm text-gray-600">Active quizzes</p>
                <Link to="/teacher/quizzes">
                  <Button className="w-full" variant="outline">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
                Analytics
              </CardTitle>
              <CardDescription>View performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-yellow-600">85%</div>
                <p className="text-sm text-gray-600">Average completion rate</p>
                <Link to="/teacher/analytics">
                  <Button className="w-full" variant="outline">View Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Quiz "English Grammar Basics" completed</p>
                    <p className="text-sm text-gray-600">John Doe - Class 10A</p>
                  </div>
                  <span className="text-xs text-gray-500">2 min ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">New student joined Class 10B</p>
                    <p className="text-sm text-gray-600">Jane Smith</p>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Quiz "Vocabulary Challenge" assigned</p>
                    <p className="text-sm text-gray-600">To Class 10A</p>
                  </div>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/teacher/students/add">
                  <Button className="w-full h-20 flex flex-col items-center justify-center">
                    <Users className="w-6 h-6 mb-2" />
                    Add Student
                  </Button>
                </Link>
                <Link to="/teacher/quizzes/create">
                  <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                    <BookOpen className="w-6 h-6 mb-2" />
                    Create Quiz
                  </Button>
                </Link>
                <Link to="/teacher/classes">
                  <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                    <Users className="w-6 h-6 mb-2" />
                    Manage Classes
                  </Button>
                </Link>
                <Link to="/teacher/settings">
                  <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                    <Settings className="w-6 h-6 mb-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
