import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Clock, TrendingUp, Lightbulb, Target, BarChart3 } from 'lucide-react';

interface MemoryEntry {
  id: string;
  entry_type: string;
  content: any;
  context_tags: string[];
  importance_score: number;
  created_at: string;
}

interface LearningInsight {
  type: string;
  message: string;
  confidence: number;
  actionable: boolean;
}

interface MemoryDashboardProps {
  memories?: MemoryEntry[];
  insights?: LearningInsight[];
  onGenerateInsights?: () => void;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({
  memories = [],
  insights = [],
  onGenerateInsights
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'insights' | 'patterns'>('memories');

  // Sample data for demonstration
  const sampleMemories: MemoryEntry[] = [
    {
      id: '1',
      entry_type: 'learning_session',
      content: {
        activity: 'vocabulary_practice',
        performance: { score: 0.85, duration: 15 },
        words_learned: 12
      },
      context_tags: ['vocabulary', 'practice', 'high_performance'],
      importance_score: 0.8,
      created_at: '2025-01-20T10:30:00Z'
    },
    {
      id: '2',
      entry_type: 'achievement',
      content: {
        achievement_name: 'Streak Master',
        unlock_context: 'Completed 7 consecutive days of study'
      },
      context_tags: ['achievement', 'streak', 'consistency'],
      importance_score: 0.9,
      created_at: '2025-01-20T09:15:00Z'
    },
    {
      id: '3',
      entry_type: 'difficulty_pattern',
      content: {
        topic: 'grammar',
        difficulty_trend: 'improving',
        accuracy_change: '+15%'
      },
      context_tags: ['grammar', 'improvement', 'pattern'],
      importance_score: 0.7,
      created_at: '2025-01-19T16:45:00Z'
    }
  ];

  const sampleInsights: LearningInsight[] = [
    {
      type: 'performance',
      message: 'Your vocabulary retention is 23% higher during morning sessions',
      confidence: 0.82,
      actionable: true
    },
    {
      type: 'timing',
      message: 'You tend to perform better with 15-20 minute focused sessions',
      confidence: 0.75,
      actionable: true
    },
    {
      type: 'difficulty',
      message: 'Consider increasing grammar exercise difficulty based on recent improvements',
      confidence: 0.68,
      actionable: true
    },
    {
      type: 'streak',
      message: 'Your longest learning streaks occur when you study at consistent times',
      confidence: 0.71,
      actionable: true
    }
  ];

  const displayMemories = memories.length > 0 ? memories : sampleMemories;
  const displayInsights = insights.length > 0 ? insights : sampleInsights;

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'learning_session':
        return <Clock className="h-4 w-4" />;
      case 'achievement':
        return <Target className="h-4 w-4" />;
      case 'difficulty_pattern':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <BarChart3 className="h-4 w-4" />;
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'difficulty':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImportanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800';
    if (score >= 0.6) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Memory Bank Dashboard
          </CardTitle>
          <CardDescription>
            Your personalized learning context and insights powered by long-term memory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'memories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('memories')}
            >
              Recent Memories
            </Button>
            <Button
              variant={activeTab === 'insights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('insights')}
            >
              Learning Insights
            </Button>
            <Button
              variant={activeTab === 'patterns' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('patterns')}
            >
              Patterns
            </Button>
          </div>

          {activeTab === 'memories' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Learning Memories</h3>
                <Badge variant="secondary">
                  {displayMemories.length} entries
                </Badge>
              </div>
              {displayMemories.map((memory) => (
                <Card key={memory.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {getEntryTypeIcon(memory.entry_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium capitalize">
                              {memory.entry_type.replace('_', ' ')}
                            </h4>
                            <Badge 
                              className={getImportanceColor(memory.importance_score)}
                              variant="secondary"
                            >
                              {Math.round(memory.importance_score * 100)}% important
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {typeof memory.content === 'object' ? (
                              <div className="space-y-1">
                                {Object.entries(memory.content).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium capitalize">
                                      {key.replace('_', ' ')}:
                                    </span>{' '}
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              String(memory.content)
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {memory.context_tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(memory.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Personalized Learning Insights</h3>
                <Button 
                  size="sm" 
                  onClick={onGenerateInsights}
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Generate New Insights
                </Button>
              </div>
              {displayInsights.map((insight, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={getConfidenceColor(insight.confidence)}
                            variant="secondary"
                          >
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Actionable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Learning Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Study Time Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Peak Performance Time:</span>
                        <span className="font-medium">Morning (9-11 AM)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimal Session Length:</span>
                        <span className="font-medium">15-20 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Study Days:</span>
                        <span className="font-medium">5.2 days average</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Vocabulary Progress:</span>
                        <span className="font-medium text-green-600">+23% this week</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Grammar Accuracy:</span>
                        <span className="font-medium text-blue-600">+15% improvement</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consistency Score:</span>
                        <span className="font-medium text-purple-600">8.4/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
