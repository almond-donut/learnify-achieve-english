import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target, Star } from 'lucide-react';

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

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  maxProgress?: number;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userAchievement,
  progress = 0,
  maxProgress = 100
}) => {
  const isEarned = !!userAchievement;
  const progressPercentage = maxProgress > 0 ? Math.min((progress / maxProgress) * 100, 100) : 0;

  const getRequirementText = (requirements: any) => {
    const { type, target, difficulty } = requirements;
    
    switch (type) {
      case 'quiz_count':
        return `Complete ${target} quizzes`;
      case 'quick_completion':
        return `Complete a quiz in under ${Math.floor(target / 60)} minutes`;
      case 'perfect_score':
        return `Score ${target}% on any quiz`;
      case 'perfect_count':
        return `Get perfect scores on ${target} quizzes`;
      case 'correct_answers':
        return `Answer ${target} questions correctly`;
      case 'different_days':
        return `Study on ${target} different days`;
      case 'daily_streak':
        return `Maintain a ${target}-day streak`;
      case 'total_points':
        return `Earn ${target.toLocaleString()} total points`;
      case 'accuracy_score':
        return `Score ${target}% or higher`;
      case 'early_completion':
        return `Complete a quiz before ${target}:00 AM`;
      case 'late_completion':
        return `Complete a quiz after ${target}:00`;
      case 'difficulty_count':
        return `Complete ${target} ${difficulty} quizzes`;
      case 'all_difficulties':
        return 'Complete quizzes in all difficulty levels';
      default:
        return 'Complete the challenge';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz_count':
      case 'perfect_count':
        return <Trophy className="h-4 w-4" />;
      case 'quick_completion':
        return <Clock className="h-4 w-4" />;
      case 'accuracy_score':
      case 'perfect_score':
        return <Star className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      isEarned 
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' 
        : 'bg-white hover:bg-gray-50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{achievement.badge_icon}</span>
            <div>
              <CardTitle className={`text-lg ${isEarned ? 'text-yellow-800' : 'text-gray-900'}`}>
                {achievement.name}
              </CardTitle>
              {isEarned && (
                <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800">
                  <Trophy className="h-3 w-3 mr-1" />
                  Earned
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              {getIcon(achievement.requirements.type)}
              <span>{achievement.points_reward} pts</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className={`text-sm mb-3 ${isEarned ? 'text-yellow-700' : 'text-gray-600'}`}>
          {achievement.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{getRequirementText(achievement.requirements)}</span>
            {!isEarned && maxProgress > 0 && (
              <span>{progress}/{maxProgress}</span>
            )}
          </div>
          
          {!isEarned && maxProgress > 0 && (
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          )}
          
          {isEarned && userAchievement && (
            <div className="text-xs text-yellow-600 font-medium">
              Earned on {new Date(userAchievement.earned_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
