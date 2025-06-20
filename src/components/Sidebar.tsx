
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Home,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const teacherNavItems = [
    { icon: Home, label: 'Dashboard', path: '/teacher' },
    { icon: Users, label: 'Students', path: '/teacher/students' },
    { icon: BookOpen, label: 'Quizzes', path: '/teacher/quizzes' },
    { icon: BarChart3, label: 'Reports', path: '/teacher/reports' },
    { icon: Settings, label: 'Settings', path: '/teacher/settings' },
  ];

  const studentNavItems = [
    { icon: Home, label: 'Dashboard', path: '/student' },
    { icon: BookOpen, label: 'Take Quiz', path: '/student/quiz' },
    { icon: BarChart3, label: 'Leaderboard', path: '/student/leaderboard' },
    { icon: GraduationCap, label: 'Achievements', path: '/student/achievements' },
    { icon: Settings, label: 'Profile', path: '/student/profile' },
  ];

  const navItems = profile?.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className="flex h-screen w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo and Title */}
      <div className="flex items-center space-x-3 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 flex items-center justify-center">
          <img 
            src="/lovable-uploads/4ee58fa4-64a2-4083-8ace-2956842baaa4.png" 
            alt="LearnifyAchieve Mascot" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">LearnifyAchieve</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{profile?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' + profile?.role && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex justify-center">
          <DarkModeToggle />
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
