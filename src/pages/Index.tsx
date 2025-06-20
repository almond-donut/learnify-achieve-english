
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Auth from './Auth';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  if (profile.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  } else {
    return <Navigate to="/student" replace />;
  }
};

export default Index;
